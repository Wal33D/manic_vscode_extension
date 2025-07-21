/**
 * Optimized 3D terrain renderer with LOD and performance enhancements
 */

(function() {
  const vscode = acquireVsCodeApi();
  
  let scene, camera, renderer, controls;
  let terrainGroup;
  let tileData = [];
  let heightData = [];
  let colorMap = {};
  let rows = 0, cols = 0;
  let raycaster, mouse;
  let hoveredObject = null;
  
  // LOD and optimization settings
  let lodLevels = [];
  let frustum = null;
  let frustumMatrix = null;
  let performanceMode = 'auto'; // 'auto', 'high', 'medium', 'low'
  let frameSkip = 0;
  let frameCounter = 0;
  
  // Display options
  let showWireframe = false;
  let showGrid = true;
  let showHeightColors = true;
  let showResources = false;
  let heightScale = 1.0;
  let terrainSegments = { x: 50, y: 50 };
  
  // Performance monitoring
  let stats = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    lastTime: performance.now(),
    frameCount: 0,
    fpsUpdateTime: 0
  };

  function initThreeJS() {
    if (typeof THREE === 'undefined') {
      setTimeout(initThreeJS, 100);
      return;
    }
    
    init();
    vscode.postMessage({ type: 'ready' });
  }

  function init() {
    const container = document.getElementById('terrain3D');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);
    scene.fog = new THREE.Fog(0x1e1e1e, 50, 300);

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);

    // Renderer setup with performance options
    renderer = new THREE.WebGLRenderer({ 
      canvas: container,
      antialias: performanceMode === 'high',
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(performanceMode === 'high' ? window.devicePixelRatio : 1);
    renderer.shadowMap.enabled = performanceMode !== 'low';
    renderer.shadowMap.type = performanceMode === 'high' ? 
      THREE.PCFSoftShadowMap : THREE.BasicShadowMap;

    // Frustum for culling
    frustum = new THREE.Frustum();
    frustumMatrix = new THREE.Matrix4();

    // Simple controls
    controls = {
      target: new THREE.Vector3(0, 0, 0),
      autoRotate: false,
      autoRotateSpeed: 0.5,
      update: function() {
        camera.lookAt(this.target);
        
        if (this.autoRotate) {
          const time = Date.now() * 0.001;
          const radius = camera.position.distanceTo(this.target);
          camera.position.x = Math.cos(time * this.autoRotateSpeed) * radius;
          camera.position.z = Math.sin(time * this.autoRotateSpeed) * radius;
        }
      },
      reset: function() {
        const maxDim = Math.max(cols || 50, rows || 50);
        camera.position.set(maxDim, maxDim * 0.8, maxDim * 1.5);
        this.target.set((cols || 50) / 2, 0, (rows || 50) / 2);
        this.update();
      }
    };
    
    setupCameraControls();
    setupLighting();
    setupPerformanceMonitor();

    // Raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event listeners
    setupEventListeners();
    
    // Start render loop
    animate();
  }

  function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = performanceMode !== 'low';
    
    if (directionalLight.castShadow) {
      directionalLight.shadow.camera.left = -100;
      directionalLight.shadow.camera.right = 100;
      directionalLight.shadow.camera.top = 100;
      directionalLight.shadow.camera.bottom = -100;
      directionalLight.shadow.mapSize.width = performanceMode === 'high' ? 2048 : 1024;
      directionalLight.shadow.mapSize.height = performanceMode === 'high' ? 2048 : 1024;
    }
    
    scene.add(directionalLight);

    // Hemisphere light for better ambient
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.3);
    scene.add(hemiLight);
  }

  function setupPerformanceMonitor() {
    const perfDiv = document.createElement('div');
    perfDiv.id = 'performance-stats-3d';
    perfDiv.style.cssText = 'position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: #fff; padding: 5px; font-size: 11px; display: none; z-index: 100;';
    document.body.appendChild(perfDiv);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        perfDiv.style.display = perfDiv.style.display === 'none' ? 'block' : 'none';
      }
    });
    
    setInterval(updatePerformanceDisplay, 100);
  }

  function updatePerformanceDisplay() {
    const perfDiv = document.getElementById('performance-stats-3d');
    if (perfDiv && perfDiv.style.display !== 'none') {
      perfDiv.innerHTML = `
        FPS: ${stats.fps}<br>
        Frame: ${stats.frameTime.toFixed(1)}ms<br>
        Draw Calls: ${stats.drawCalls}<br>
        Triangles: ${stats.triangles}<br>
        Mode: ${performanceMode}<br>
        Segments: ${terrainSegments.x}x${terrainSegments.y}
      `;
    }
  }

  function calculateLODLevel(distance) {
    if (distance < 50) return 0; // Highest detail
    if (distance < 100) return 1;
    if (distance < 200) return 2;
    return 3; // Lowest detail
  }

  function getSegmentsForLOD(lodLevel) {
    const baseSegments = Math.min(rows - 1, cols - 1);
    switch (lodLevel) {
      case 0: return { x: baseSegments, y: baseSegments };
      case 1: return { x: Math.floor(baseSegments / 2), y: Math.floor(baseSegments / 2) };
      case 2: return { x: Math.floor(baseSegments / 4), y: Math.floor(baseSegments / 4) };
      case 3: return { x: Math.floor(baseSegments / 8), y: Math.floor(baseSegments / 8) };
      default: return { x: 16, y: 16 };
    }
  }

  function createOptimizedTerrain() {
    if (!tileData || tileData.length === 0) return;

    // Remove existing terrain
    if (terrainGroup) {
      scene.remove(terrainGroup);
      terrainGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    terrainGroup = new THREE.Group();
    
    // Calculate distance from camera for initial LOD
    const centerX = cols / 2;
    const centerZ = rows / 2;
    const distance = camera.position.distanceTo(new THREE.Vector3(centerX, 0, centerZ));
    const lodLevel = calculateLODLevel(distance);
    terrainSegments = getSegmentsForLOD(lodLevel);

    // Create terrain chunks for better culling
    const chunkSize = 32;
    const chunksX = Math.ceil(cols / chunkSize);
    const chunksZ = Math.ceil(rows / chunkSize);

    for (let cx = 0; cx < chunksX; cx++) {
      for (let cz = 0; cz < chunksZ; cz++) {
        const startX = cx * chunkSize;
        const startZ = cz * chunkSize;
        const endX = Math.min(startX + chunkSize, cols);
        const endZ = Math.min(startZ + chunkSize, rows);
        
        createTerrainChunk(startX, startZ, endX - startX, endZ - startZ, lodLevel);
      }
    }

    scene.add(terrainGroup);
    
    // Update stats
    stats.drawCalls = renderer.info.render.calls;
    stats.triangles = renderer.info.render.triangles;
  }

  function createTerrainChunk(offsetX, offsetZ, width, height, lodLevel) {
    const geometry = new THREE.PlaneGeometry(
      width,
      height,
      Math.max(1, Math.floor(width / (1 << lodLevel))),
      Math.max(1, Math.floor(height / (1 << lodLevel)))
    );
    
    const vertices = geometry.attributes.position.array;
    const colors = new Float32Array(vertices.length);
    
    // Apply height values
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const x = vertices[i * 3] + width / 2 + offsetX;
      const z = vertices[i * 3 + 1] + height / 2 + offsetZ;
      
      const gridX = Math.floor(x);
      const gridZ = Math.floor(z);
      
      if (gridX >= 0 && gridX < cols && gridZ >= 0 && gridZ < rows) {
        const heightValue = heightData[gridZ]?.[gridX] || 0;
        vertices[i * 3 + 2] = heightValue * heightScale * 0.1;
        
        // Color based on tile type
        const tileId = tileData[gridZ]?.[gridX] || 0;
        const color = colorMap[tileId] || { r: 128, g: 128, b: 128 };
        colors[i * 3] = color.r / 255;
        colors[i * 3 + 1] = color.g / 255;
        colors[i * 3 + 2] = color.b / 255;
      }
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    
    // Material with vertex colors
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      flatShading: lodLevel > 1,
      wireframe: showWireframe,
      side: THREE.DoubleSide,
      fog: true
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(offsetX + width / 2, 0, offsetZ + height / 2);
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = performanceMode === 'high';
    mesh.receiveShadow = performanceMode !== 'low';
    
    // Store chunk info for culling
    mesh.userData = {
      offsetX,
      offsetZ,
      width,
      height,
      lodLevel
    };
    
    terrainGroup.add(mesh);
  }

  function updateTerrain() {
    if (!terrainGroup) return;
    
    // Update frustum
    frustumMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(frustumMatrix);
    
    let visibleChunks = 0;
    
    terrainGroup.children.forEach((chunk) => {
      if (chunk.isMesh) {
        // Frustum culling
        if (frustum.intersectsObject(chunk)) {
          chunk.visible = true;
          visibleChunks++;
          
          // Update LOD based on distance
          const distance = camera.position.distanceTo(chunk.position);
          const newLodLevel = calculateLODLevel(distance);
          
          if (newLodLevel !== chunk.userData.lodLevel) {
            // Recreate chunk with new LOD
            const { offsetX, offsetZ, width, height } = chunk.userData;
            
            // Remove old chunk
            terrainGroup.remove(chunk);
            chunk.geometry.dispose();
            chunk.material.dispose();
            
            // Create new chunk with updated LOD
            createTerrainChunk(offsetX, offsetZ, width, height, newLodLevel);
          }
        } else {
          chunk.visible = false;
        }
      }
    });
    
    // Update stats
    stats.drawCalls = visibleChunks;
  }

  function adaptPerformance() {
    if (performanceMode === 'auto') {
      const targetFPS = 30;
      
      if (stats.fps < targetFPS * 0.5 && stats.frameCount > 10) {
        // Very poor performance
        performanceMode = 'low';
        renderer.shadowMap.enabled = false;
        frameSkip = 2;
      } else if (stats.fps < targetFPS * 0.8 && stats.frameCount > 10) {
        // Poor performance
        if (performanceMode === 'high') {
          performanceMode = 'medium';
          renderer.setPixelRatio(1);
          frameSkip = 1;
        }
      } else if (stats.fps > targetFPS * 1.5 && stats.frameCount > 30) {
        // Good performance
        if (performanceMode === 'low') {
          performanceMode = 'medium';
          renderer.shadowMap.enabled = true;
          frameSkip = 0;
        } else if (performanceMode === 'medium') {
          performanceMode = 'high';
          renderer.setPixelRatio(window.devicePixelRatio);
        }
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    
    // Frame skipping for performance
    if (frameSkip > 0 && frameCounter % (frameSkip + 1) !== 0) {
      frameCounter++;
      return;
    }
    frameCounter++;
    
    const startTime = performance.now();
    
    // Update controls and terrain
    controls.update();
    updateTerrain();
    
    // Render
    renderer.render(scene, camera);
    
    // Update stats
    const endTime = performance.now();
    stats.frameTime = endTime - startTime;
    stats.frameCount++;
    
    const elapsed = endTime - stats.fpsUpdateTime;
    if (elapsed >= 1000) {
      stats.fps = Math.round((stats.frameCount * 1000) / elapsed);
      stats.frameCount = 0;
      stats.fpsUpdateTime = endTime;
      stats.triangles = renderer.info.render.triangles;
      
      adaptPerformance();
    }
  }

  function setupCameraControls() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    renderer.domElement.addEventListener('mousemove', (e) => {
      if (!isDragging) {
        // Update mouse position for raycasting
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        return;
      }
      
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      // Rotate camera
      const spherical = new THREE.Spherical();
      const offset = camera.position.clone().sub(controls.target);
      spherical.setFromVector3(offset);
      
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.01;
      const distance = camera.position.distanceTo(controls.target);
      const newDistance = Math.max(10, Math.min(300, distance + delta));
      
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance));
      controls.update();
    });
  }

  function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    
    // Control toggles
    document.getElementById('toggleWireframe').addEventListener('change', (e) => {
      showWireframe = e.target.checked;
      if (terrainGroup) {
        terrainGroup.traverse((child) => {
          if (child.isMesh) {
            child.material.wireframe = showWireframe;
          }
        });
      }
    });
    
    document.getElementById('toggleAutoRotate').addEventListener('change', (e) => {
      controls.autoRotate = e.target.checked;
    });
    
    document.getElementById('heightScale').addEventListener('input', (e) => {
      heightScale = parseFloat(e.target.value);
      document.getElementById('heightScaleValue').textContent = heightScale.toFixed(1);
      createOptimizedTerrain();
    });
    
    document.getElementById('qualityMode').addEventListener('change', (e) => {
      performanceMode = e.target.value;
      if (performanceMode !== 'auto') {
        frameSkip = performanceMode === 'low' ? 2 : performanceMode === 'medium' ? 1 : 0;
        renderer.setPixelRatio(performanceMode === 'high' ? window.devicePixelRatio : 1);
        renderer.shadowMap.enabled = performanceMode !== 'low';
      }
      createOptimizedTerrain();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        controls.reset();
      } else if (e.key === 'w' || e.key === 'W') {
        const wireframeCheckbox = document.getElementById('toggleWireframe');
        wireframeCheckbox.checked = !wireframeCheckbox.checked;
        wireframeCheckbox.dispatchEvent(new Event('change'));
      } else if (e.key === 'a' || e.key === 'A') {
        const autoRotateCheckbox = document.getElementById('toggleAutoRotate');
        autoRotateCheckbox.checked = !autoRotateCheckbox.checked;
        autoRotateCheckbox.dispatchEvent(new Event('change'));
      }
    });
  }

  function onWindowResize() {
    const container = document.getElementById('terrain3D');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
      case 'updateTerrain':
        tileData = message.tiles;
        heightData = message.height || [];
        colorMap = message.colorMap;
        rows = message.rowcount;
        cols = message.colcount;
        
        document.getElementById('dimensions').textContent = 
          `Terrain: ${rows}×${cols}`;
        
        controls.reset();
        createOptimizedTerrain();
        break;
        
      case 'noData':
        if (terrainGroup) {
          scene.remove(terrainGroup);
        }
        break;
    }
  });

  // Initialize Three.js
  initThreeJS();
})();