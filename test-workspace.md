# Workspace Testing Plan

## To test the new workspace:

1. Press F5 in VS Code to launch the Extension Development Host
2. Open a .dat file in the test instance
3. Open Command Palette (Cmd+Shift+P) and run "Manic Miners: Show Workspace"
4. Test the following features:

### Panel Management
- [ ] Toggle panels using quick action buttons
- [ ] Drag panels (floating mode)
- [ ] Resize panels
- [ ] Minimize/maximize panels
- [ ] Close panels

### Tabbed Interface
- [ ] Click tabs to switch between panels in same group
- [ ] Close tabs using the × button
- [ ] Verify only one tab is active per group

### Layout Presets
- [ ] Click Mapping Mode button
- [ ] Click Scripting Mode button
- [ ] Click Analysis Mode button
- [ ] Save custom layout
- [ ] Load saved layout

### Panel Content Interaction
- [ ] Select tools in Tools panel
- [ ] Select tiles in Tile Palette
- [ ] Toggle layers in Layers panel
- [ ] Adjust properties in Properties panel
- [ ] Insert script patterns
- [ ] Run validation
- [ ] View statistics
- [ ] Navigate history

### Status Bar
- [ ] Verify current tool updates
- [ ] Verify selected tile updates
- [ ] Verify panel count updates

## Expected Behavior
- Smooth animations and transitions
- Responsive to window resizing
- Proper theme integration
- No console errors