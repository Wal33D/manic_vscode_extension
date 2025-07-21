import * as vscode from 'vscode';
import { DatFileParser } from './parser/datFileParser';
import { VisualBlocksParser } from './parser/visualBlocksParser';

export class DatDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition> {
    const lineText = document.lineAt(position).text;
    const wordRange = document.getWordRangeAtPosition(position);
    const word = wordRange ? document.getText(wordRange) : '';

    // Parse the document
    const parser = new DatFileParser(document.getText());
    const currentSection = parser.getSectionAtPosition(position.line);

    // Handle section references
    if (this.isSectionReference(word)) {
      const targetSection = parser.getSection(word);
      if (targetSection) {
        return new vscode.Location(document.uri, new vscode.Position(targetSection.startLine, 0));
      }
    }

    // Handle entity IDs in script section
    if (currentSection?.name === 'script') {
      // Check for entity ID references in enable/disable commands
      const entityMatch = lineText.match(/(?:enable|disable|wake)\s*:\s*(\w+)/);
      if (entityMatch && position.character >= lineText.indexOf(entityMatch[1])) {
        const entityId = entityMatch[1];
        return this.findEntityDefinition(document, entityId, parser);
      }

      // Check for event references in when() conditions
      const whenMatch = lineText.match(/when\s*\([^)]*\)\s*\[(\w+)\]/);
      if (whenMatch && position.character >= lineText.indexOf(whenMatch[1])) {
        const eventName = whenMatch[1];
        return this.findEventDefinition(document, eventName, parser);
      }

      // Check for timer event references
      const timerMatch = lineText.match(/timer\s+(\w+)\s*=.*?,\s*(\w+)\s*$/);
      if (timerMatch && timerMatch[2] && position.character >= lineText.indexOf(timerMatch[2])) {
        const eventName = timerMatch[2];
        return this.findEventDefinition(document, eventName, parser);
      }

      // Check for event chain calls (call:EventName)
      const callMatch = lineText.match(/call\s*:\s*(\w+)/);
      if (callMatch && position.character >= lineText.indexOf(callMatch[1])) {
        const eventName = callMatch[1];
        // First check visual blocks, then script events
        const blocksLocation = this.findEventInBlocks(document, eventName, parser);
        if (blocksLocation) {
          return blocksLocation;
        }
        return this.findEventDefinition(document, eventName, parser);
      }

      // Check for variable references
      const varRefMatch = lineText.match(/(\w+)\s*:/);
      if (varRefMatch && !lineText.includes('::') && position.character <= lineText.indexOf(':')) {
        const varName = varRefMatch[1];
        return this.findVariableDefinition(document, varName, parser);
      }

      // Check for event references
      if (lineText.includes('::') || lineText.includes('))')) {
        const eventName = this.extractEventName(lineText);
        if (eventName) {
          // First check visual blocks, then script events
          const blocksLocation = this.findEventInBlocks(document, eventName, parser);
          if (blocksLocation) {
            return blocksLocation;
          }
          return this.findEventDefinition(document, eventName, parser);
        }
      }
    }

    // Handle visual blocks section
    if (currentSection?.name === 'blocks') {
      // Check for wire connections (e.g., 1-2, 1~2, 1?2)
      const wireMatch = lineText.match(/(\d+)([-~?])(\d+)/);
      if (wireMatch) {
        const fromId = parseInt(wireMatch[1]);
        const toId = parseInt(wireMatch[3]);
        // Navigate to the block definition based on cursor position
        const cursorPos = position.character;
        const fromStart = lineText.indexOf(wireMatch[1]);
        const toStart = lineText.indexOf(wireMatch[3], fromStart + wireMatch[1].length);

        const targetId = cursorPos <= toStart ? fromId : toId;
        return this.findBlockDefinition(document, targetId, parser);
      }

      // Check for EventCallEvent function references
      const eventCallMatch = lineText.match(/EventCallEvent:[^,]+,[^,]+,[^,]+,(\w+)/);
      if (eventCallMatch && position.character >= lineText.indexOf(eventCallMatch[1])) {
        const eventName = eventCallMatch[1];
        return this.findEventDefinition(document, eventName, parser);
      }
    }

    // Handle cave connections in info section
    if (currentSection?.name === 'info' && lineText.includes('opencaves')) {
      const caveMatch = lineText.match(/(\d+),(\d+)/g);
      if (caveMatch) {
        // Find the tiles section to jump to the cave location
        const tilesSection = parser.getSection('tiles');
        if (tilesSection) {
          return new vscode.Location(
            document.uri,
            new vscode.Position(tilesSection.startLine + 1, 0)
          );
        }
      }
    }

    // Handle objective references
    if (currentSection?.name === 'objectives') {
      if (lineText.includes('variable:')) {
        const varMatch = lineText.match(/variable\s*:\s*(\w+)/);
        if (varMatch) {
          const varName = varMatch[1];
          return this.findVariableDefinition(document, varName, parser);
        }
      }
    }

    return undefined;
  }

  private isSectionReference(word: string): boolean {
    const sections = [
      'comments',
      'info',
      'tiles',
      'height',
      'resources',
      'objectives',
      'buildings',
      'vehicles',
      'creatures',
      'miners',
      'blocks',
      'script',
      'briefing',
      'briefingsuccess',
      'briefingfailure',
      'landslidefrequency',
      'lavaspread',
    ];
    return sections.includes(word.toLowerCase());
  }

  private findEntityDefinition(
    document: vscode.TextDocument,
    entityId: string,
    parser: DatFileParser
  ): vscode.Location | undefined {
    // Search in buildings, vehicles, creatures, and miners sections
    const entitySections = ['buildings', 'vehicles', 'creatures', 'miners'];

    for (const sectionName of entitySections) {
      const section = parser.getSection(sectionName);
      if (section) {
        const lines = section.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`ID=${entityId}`)) {
            return new vscode.Location(
              document.uri,
              new vscode.Position(section.startLine + i + 1, 0)
            );
          }
        }
      }
    }

    return undefined;
  }

  private findEventDefinition(
    document: vscode.TextDocument,
    eventName: string,
    parser: DatFileParser
  ): vscode.Location | undefined {
    const scriptSection = parser.getSection('script');
    if (!scriptSection) {
      return undefined;
    }

    const lines = scriptSection.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      // Look for event definition
      if (lines[i].includes(`${eventName}::`) && !lines[i].includes('((')) {
        return new vscode.Location(
          document.uri,
          new vscode.Position(scriptSection.startLine + i + 1, 0)
        );
      }
    }

    return undefined;
  }

  private findVariableDefinition(
    document: vscode.TextDocument,
    varName: string,
    parser: DatFileParser
  ): vscode.Location | undefined {
    const scriptSection = parser.getSection('script');
    if (!scriptSection) {
      return undefined;
    }

    const lines = scriptSection.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      // Look for typed variable definition
      const typedVarMatch = lines[i].match(/(?:int|string|float|bool|timer|arrow)\s+(\w+)\s*=/);
      if (typedVarMatch && typedVarMatch[1] === varName) {
        return new vscode.Location(
          document.uri,
          new vscode.Position(scriptSection.startLine + i + 1, 0)
        );
      }

      // Look for untyped variable definition (legacy format)
      const untypedVarMatch = lines[i].match(/^\s*(\w+)\s*=/);
      if (untypedVarMatch && untypedVarMatch[1] === varName) {
        return new vscode.Location(
          document.uri,
          new vscode.Position(scriptSection.startLine + i + 1, 0)
        );
      }
    }

    return undefined;
  }

  private extractEventName(lineText: string): string | undefined {
    // Extract event name from event call (e.g., EventName::)
    const eventCallMatch = lineText.match(/(\w+)\s*::(?!:)/);
    if (eventCallMatch) {
      return eventCallMatch[1];
    }

    // Extract event name from event definition
    const eventDefMatch = lineText.match(/^\s*(\w+)\s*::/);
    if (eventDefMatch) {
      return eventDefMatch[1];
    }

    // Extract from old-style event calls (e.g., ))EventName;)
    const oldStyleMatch = lineText.match(/\)\)\s*(\w+)\s*;/);
    if (oldStyleMatch) {
      return oldStyleMatch[1];
    }

    return undefined;
  }

  private findEventInBlocks(
    document: vscode.TextDocument,
    eventName: string,
    parser: DatFileParser
  ): vscode.Location | undefined {
    const blocksSection = parser.getSection('blocks');
    if (!blocksSection) {
      return undefined;
    }

    const blocksParser = new VisualBlocksParser(blocksSection.content, blocksSection.startLine);
    const { blocks } = blocksParser.parse();

    // Look for TriggerEventChain blocks with matching name
    for (const block of blocks) {
      if (block.name === 'TriggerEventChain' && block.parameters.name === eventName) {
        return new vscode.Location(
          document.uri,
          new vscode.Position((block.line || blocksSection.startLine) - 1, 0)
        );
      }
    }

    return undefined;
  }

  private findBlockDefinition(
    document: vscode.TextDocument,
    blockId: number,
    parser: DatFileParser
  ): vscode.Location | undefined {
    const blocksSection = parser.getSection('blocks');
    if (!blocksSection) {
      return undefined;
    }

    const lines = blocksSection.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      // Look for block definition (e.g., 1/TriggerTimer:...)
      const blockMatch = lines[i].match(/^(\d+)\/(\w+):/);
      if (blockMatch && parseInt(blockMatch[1]) === blockId) {
        return new vscode.Location(
          document.uri,
          new vscode.Position(blocksSection.startLine + i + 1, 0)
        );
      }
    }

    return undefined;
  }
}
