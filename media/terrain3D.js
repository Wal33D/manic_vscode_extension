(function() {
  const vscode = acquireVsCodeApi();
  
  let scene, camera, renderer, controls;
  let terrain, wireframe;
  let tileData = [];
  let heightData = [];
  let colorMap = {};
  let rows = 0, cols = 0;
  let raycaster, mouse;
  let hoveredObject = null;
  
  // Display options
  let showWireframe = false;
  let showGrid = true;
  let showHeightColors = true;
  let showResources = false;
  let heightScale = 1.0;

  // Initialize when Three.js is ready
  function initThreeJS() {
    if (typeof THREE === 'undefined') {
      setTimeout(initThreeJS, 100);
      return;
    }
    
    init();
    vscode.postMessage({ type: 'ready' });
  }

  // Initialize Three.js scene
  function init() {
    const container = document.getElementById('terrain3D');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);
    scene.fog = new THREE.Fog(0x1e1e1e, 100, 500);

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
      canvas: container,
      antialias: true 
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Simple orbit controls (since OrbitControls might not be available)
    controls = {
      target: new THREE.Vector3(0, 0, 0),
      update: function() {
        camera.lookAt(this.target);
      },
      reset: function() {
        camera.position.set(50, 50, 50);
        this.target.set(0, 0, 0);
        this.update();
      }
    };
    
    // Manual camera controls
    setupCameraControls();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event listeners
    setupEventListeners();
    
    // Start render loop
    animate();
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
      if (!isDragging) return;
      
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      // Rotate camera around target
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
    
    // Mouse wheel for zoom
    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.01;
      const distance = camera.position.distanceTo(controls.target);
      const newDistance = Math.max(10, Math.min(200, distance + delta));
      
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance));
      controls.update();
    });
  }

  function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', onWindowResize);
    
    // Mouse events for tile interaction
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    
    // Control buttons
    document.getElementById('viewTop').addEventListener('click', () => setView('top'));
    document.getElementById('viewIso').addEventListener('click', () => setView('iso'));
    document.getElementById('viewSide').addEventListener('click', () => setView('side'));
    document.getElementById('resetView').addEventListener('click', () => setView('reset'));
    
    // Display toggles
    document.getElementById('toggleWireframe').addEventListener('change', (e) => {
      showWireframe = e.target.checked;
      updateTerrainDisplay();
    });
    
    document.getElementById('toggleGrid').addEventListener('change', (e) => {
      showGrid = e.target.checked;
      updateTerrainDisplay();
    });
    
    document.getElementById('toggleHeightColors').addEventListener('change', (e) => {
      showHeightColors = e.target.checked;
      updateTerrainDisplay();
    });
    
    document.getElementById('toggleResources').addEventListener('change', (e) => {
      showResources = e.target.checked;
      updateTerrainDisplay();
    });
    
    // Height scale
    document.getElementById('heightScale').addEventListener('input', (e) => {
      heightScale = parseFloat(e.target.value);
      document.getElementById('heightScaleValue').textContent = heightScale.toFixed(1) + 'x';
      updateTerrainGeometry();
    });
  }

  function createTerrain(data) {
    // Remove existing terrain
    if (terrain) {
      scene.remove(terrain);
      terrain.geometry.dispose();
      terrain.material.dispose();
    }
    
    tileData = data.tiles;
    heightData = data.height;
    colorMap = data.colorMap;
    rows = data.rows;
    cols = data.cols;

    // Create geometry
    const geometry = new THREE.PlaneGeometry(cols, rows, cols - 1, rows - 1);
    geometry.rotateX(-Math.PI / 2);

    // Update vertices with height data
    const vertices = geometry.attributes.position.array;
    const colors = new Float32Array(vertices.length);
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const vertexIndex = (i * cols + j) * 3;
        const height = heightData[i][j] || 0;
        vertices[vertexIndex + 1] = height * 0.1 * heightScale; // Y coordinate
        
        // Color based on tile type or height
        const tileId = tileData[i][j];
        const color = getColorForTile(tileId, height);
        colors[vertexIndex] = color.r;
        colors[vertexIndex + 1] = color.g;
        colors[vertexIndex + 2] = color.b;
      }
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // Create material
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: true,
      shininess: 0,
    });

    // Create mesh
    terrain = new THREE.Mesh(geometry, material);
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Create wireframe overlay
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x444444,
      transparent: true,
      opacity: 0.5
    });
    wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.visible = showWireframe;
    scene.add(wireframe);

    // Center camera on terrain
    controls.target.set(cols / 2, 0, rows / 2);
    camera.position.set(cols, cols * 0.8, rows * 1.5);
    controls.update();
  }

  function getColorForTile(tileId, height) {
    if (showHeightColors) {
      // Color based on height
      const normalizedHeight = (height + 200) / 400; // Normalize assuming height range -200 to 200
      const hue = 0.3 - normalizedHeight * 0.3; // Green to red
      return new THREE.Color().setHSL(hue, 0.7, 0.5);
    } else {
      // Color based on tile type
      const tileColor = colorMap[tileId] || '#808080';
      return new THREE.Color(tileColor);
    }
  }

  function updateTerrainDisplay() {
    if (wireframe) {
      wireframe.visible = showWireframe;
    }
    
    if (terrain) {
      createTerrain({
        tiles: tileData,
        height: heightData,
        rows: rows,
        cols: cols,
        colorMap: colorMap
      });
    }
  }

  function updateTerrainGeometry() {
    if (terrain && heightData.length > 0) {
      const vertices = terrain.geometry.attributes.position.array;
      
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const vertexIndex = (i * cols + j) * 3;
          const height = heightData[i][j] || 0;
          vertices[vertexIndex + 1] = height * 0.1 * heightScale;
        }
      }
      
      terrain.geometry.attributes.position.needsUpdate = true;
      terrain.geometry.computeVertexNormals();
    }
  }

  function setView(viewType) {
    switch (viewType) {
      case 'top':
        camera.position.set(cols / 2, cols * 1.5, rows / 2);
        camera.lookAt(cols / 2, 0, rows / 2);
        break;
      case 'iso':
        camera.position.set(cols, cols * 0.8, rows * 1.5);
        camera.lookAt(cols / 2, 0, rows / 2);
        break;
      case 'side':
        camera.position.set(cols * 1.5, cols * 0.5, rows / 2);
        camera.lookAt(cols / 2, 0, rows / 2);
        break;
      case 'reset':
        controls.reset();
        break;
    }
    controls.update();
  }

  function onMouseMove(event) {
    // Update mouse coordinates for raycasting
    updateMouseCoordinates(event);
    
    if (terrain) {
      const intersects = raycaster.intersectObject(terrain);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const x = Math.floor(point.x);
        const z = Math.floor(point.z);
        
        if (x >= 0 && x < cols && z >= 0 && z < rows) {
          const tileId = tileData[z][x];
          const height = heightData[z][x];
          document.getElementById('tileInfo').textContent = 
            `Tile [${x}, ${z}]: ID ${tileId}, Height: ${height}`;
        }
      }
    }
  }
  
  function updateMouseCoordinates(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  function onMouseClick(event) {
    updateMouseCoordinates(event);
    
    if (terrain) {
      const intersects = raycaster.intersectObject(terrain);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const x = Math.floor(point.x);
        const z = Math.floor(point.z);
        
        if (x >= 0 && x < cols && z >= 0 && z < rows) {
          const tileId = tileData[z][x];
          vscode.postMessage({
            type: 'tileClick',
            x: x,
            z: z,
            tileId: tileId
          });
        }
      }
    }
  }

  function onWindowResize() {
    const container = document.getElementById('terrain3D');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  // Listen for messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
      case 'updateTerrain':
        createTerrain(message.data);
        break;
      case 'error':
        console.error(message.message);
        break;
    }
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeJS);
  } else {
    initThreeJS();
  }
})();