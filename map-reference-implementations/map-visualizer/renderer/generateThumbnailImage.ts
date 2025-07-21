import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import * as dotenv from 'dotenv';
import { colors } from '../utils/colorMap';
import { parseMapDataFromFile } from '../fileParser/mapFileParser';
import { Color, GenerateImageResult } from '../types';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';

dotenv.config({ path: '.env.local' });

export const generateThumbnailImage = async ({ filePath, outputFileName = 'thumbnail_render.png' }: { filePath: string; outputFileName?: string }): Promise<GenerateImageResult> => {
    let status = false;
    const outputDir = path.dirname(filePath);
    const thumbnailPath = path.join(outputDir, outputFileName);

    let fileAccessed = false;
    let parseDataSuccess = false;
    let wallArrayGenerated = false;
    let imageBufferCreated = false;
    let fileSaved = false;
    let imageCreated = false;
    const errorDetails: GenerateImageResult['errorDetails'] = {};
    let imageBuffer: Buffer | undefined;

    try {
        await fs.access(thumbnailPath);
        fileAccessed = true;
    } catch (accessError) {
        if ((accessError as NodeJS.ErrnoException).code !== 'ENOENT') {
            errorDetails.accessError = (accessError as Error).message;
        }
    }

    try {
        if (!fileAccessed) {
            const parsedData = await parseMapDataFromFile({ filePath });
            parseDataSuccess = true;
            const wallArray = create2DArray(parsedData.tilesArray, parsedData.colcount);
            wallArrayGenerated = true;
            imageBuffer = await createThumbnailBuffer(wallArray);
            imageBufferCreated = true;
            await sharp(imageBuffer).toFile(thumbnailPath);
            fileSaved = true;
            imageCreated = true;
        }
        status = true;
    } catch (error: any) {
        if (!parseDataSuccess) errorDetails.parseError = error.message;
        else if (!wallArrayGenerated) errorDetails.bufferError = error.message;
        else if (!imageBufferCreated) errorDetails.bufferError = error.message;
        else errorDetails.saveError = error.message;
    }

    return {
        status,
        filePath: thumbnailPath,
        fileAccessed,
        parseDataSuccess,
        wallArrayGenerated,
        imageBuffer,
        imageBufferCreated,
        fileSaved,
        imageCreated,
        errorDetails,
    };
};

const createThumbnailBuffer = async (wallArray: number[][]) => {
    const scale = 10;
    let width = wallArray.length;
    let height = wallArray[0].length;

    // Switch height and width if height is greater than width
    if (height > width) {
        [width, height] = [height, width];
    }

    const canvas = createCanvas(width * scale, height * scale);
    const ctx = canvas.getContext('2d');

    await renderThumbnailTiles(ctx, wallArray, scale);
    const buffer = canvas.toBuffer('image/png');

    // Rotate the image to portrait mode if width is greater than height
    let finalBuffer = buffer;
    if (width > height) {
        finalBuffer = await sharp(buffer)
            .rotate(90)
            .resize(320, 320, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer();
    } else {
        finalBuffer = await sharp(buffer)
            .resize(320, 320, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer();
    }

    return finalBuffer;
};

const renderThumbnailTiles = async (ctx: CanvasRenderingContext2D, wallArray: number[][], scale: number) => {
    for (let y = 0; y < wallArray.length; y++) {
        for (let x = 0; x < wallArray[0].length; x++) {
            const tile = wallArray[y][x];
            const color = colors[tile] || { r: 255, g: 255, b: 255, a: 1 };
            drawThumbnailTile(ctx, x, y, scale, color);
        }
    }
};

const drawThumbnailTile = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: { r: number; g: number; b: number; a: number }) => {
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    ctx.fillRect(x * scale, y * scale, scale, scale);
};

const create2DArray = (data: number[], width: number): number[][] => {
    const result: number[][] = [];
    for (let i = 0; i < data.length; i += width) {
        result.push(data.slice(i, i + width));
    }
    return result;
};
