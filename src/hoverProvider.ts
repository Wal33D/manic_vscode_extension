import * as vscode from 'vscode';

const infoFieldDescriptions: { [key: string]: string } = {
  rowcount: 'Number of rows in the map.',
  colcount: 'Number of columns in the map.',
  camerapos: 'Camera position with translation, rotation, and scale.',
  biome: 'The biome type of the map (e.g., rock, ice, lava).',
  creator: 'Name of the map creator.',
  erosioninitialwaittime: 'Initial wait time before erosion starts.',
  spiderchance: 'Chance of spiders appearing.',
  erosionscale: 'Scale of the erosion effect.',
  camerazoom: 'Initial camera zoom level.',
  version: 'Version of the map.',
  oxygen: 'Oxygen levels in the map.',
  levelname: 'Name of the level.',
  initialcrystals: 'Initial number of crystals.',
  initialore: 'Initial number of ore.',
  cameraangle: 'Initial camera angle.',
  initialheight: 'Initial height of the map.',
  maxheight: 'Maximum height of the map.',
  minheight: 'Minimum height of the map.',
  gravity: 'Gravity setting of the map.',
  ambientlight: 'Ambient light level in the map.',
  weather: 'Weather conditions in the map.',
  difficulty: 'Difficulty level of the map.',
  resourcespeed: 'Speed of resource collection.',
  enemystrength: 'Strength of enemies in the map.',
  mapdescription: 'Description of the map.',
  translation:
    'Translation component of camerapos, representing the position in X, Y, Z coordinates.',
  rotation:
    'Rotation component of camerapos, representing the pitch (P), yaw (Y), and roll (R) angles.',
  scale: 'Scale component of camerapos, representing the scale in X, Y, Z axes.',
};

export class DatHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const range = document.getWordRangeAtPosition(position, /[a-zA-Z]+/);
    const word = document.getText(range).toLowerCase();

    if (infoFieldDescriptions[word]) {
      return new vscode.Hover(infoFieldDescriptions[word]);
    }

    // Additional check for camerapos components
    const cameraposRange = document.getWordRangeAtPosition(position, /Translation|Rotation|Scale/);
    if (cameraposRange) {
      const cameraposWord = document.getText(cameraposRange).toLowerCase();
      if (infoFieldDescriptions[cameraposWord]) {
        return new vscode.Hover(infoFieldDescriptions[cameraposWord]);
      }
    }

    return undefined;
  }
}
