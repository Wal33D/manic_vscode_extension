"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const infoFieldDescriptions = {
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
    mapdescription: 'Description of the map.'
};
class DatHoverProvider {
    provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position, /[a-zA-Z]+/);
        const word = document.getText(range);
        if (infoFieldDescriptions[word]) {
            return new vscode.Hover(infoFieldDescriptions[word]);
        }
        return null;
    }
}
exports.DatHoverProvider = DatHoverProvider;
//# sourceMappingURL=datHoverProvider.js.map