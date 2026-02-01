import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface FragmentImage {
    index: number; // 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
    uri: string;
    blurredUri: string;
}

/**
 * Split an image into 4 quadrants and create blurred versions
 */
export async function splitImageIntoFragments(imageUri: string): Promise<FragmentImage[]> {
    try {
        console.log('[PhotoSplitter] Splitting image:', imageUri);

        // First, get image dimensions by manipulating with no operations
        const imageInfo = await manipulateAsync(imageUri, [], { format: SaveFormat.JPEG });

        // Calculate quadrant dimensions
        const halfWidth = Math.floor(imageInfo.width / 2);
        const halfHeight = Math.floor(imageInfo.height / 2);

        const fragments: FragmentImage[] = [];

        // Define crop regions for each quadrant
        const quadrants = [
            { index: 0, x: 0, y: 0, width: halfWidth, height: halfHeight }, // Top-left
            { index: 1, x: halfWidth, y: 0, width: halfWidth, height: halfHeight }, // Top-right
            { index: 2, x: 0, y: halfHeight, width: halfWidth, height: halfHeight }, // Bottom-left
            { index: 3, x: halfWidth, y: halfHeight, width: halfWidth, height: halfHeight }, // Bottom-right
        ];

        // Create each fragment
        for (const quad of quadrants) {
            // Crop to quadrant
            const croppedImage = await manipulateAsync(
                imageUri,
                [
                    {
                        crop: {
                            originX: quad.x,
                            originY: quad.y,
                            width: quad.width,
                            height: quad.height,
                        },
                    },
                    // Resize to standard size for consistency
                    { resize: { width: 300, height: 300 } },
                ],
                { compress: 0.8, format: SaveFormat.JPEG }
            );

            // Create blurred version
            const blurredImage = await blurFragment(croppedImage.uri);

            fragments.push({
                index: quad.index,
                uri: croppedImage.uri,
                blurredUri: blurredImage,
            });

            console.log(`[PhotoSplitter] Created fragment ${quad.index}`);
        }

        return fragments;
    } catch (error) {
        console.error('[PhotoSplitter] Error splitting image:', error);
        throw error;
    }
}

/**
 * Apply blur effect to an image
 */
export async function blurFragment(imageUri: string): Promise<string> {
    try {
        // Apply blur effect (using brightness reduction as blur approximation)
        // Note: expo-image-manipulator doesn't have native blur, so we use brightness/contrast
        const blurred = await manipulateAsync(
            imageUri,
            [
                // Reduce brightness to simulate blur lock
                { resize: { width: 100, height: 100 } }, // Downscale
                { resize: { width: 300, height: 300 } }, // Upscale (creates pixelation/blur effect)
            ],
            { compress: 0.5, format: SaveFormat.JPEG }
        );

        return blurred.uri;
    } catch (error) {
        console.error('[PhotoSplitter] Error blurring image:', error);
        throw error;
    }
}

/**
 * Generate a blurred preview for a fragment marker
 * (smaller size for map markers)
 */
export async function createFragmentMarkerPreview(imageUri: string): Promise<string> {
    try {
        const preview = await manipulateAsync(
            imageUri,
            [
                { resize: { width: 80, height: 80 } },
            ],
            { compress: 0.6, format: SaveFormat.JPEG }
        );

        return preview.uri;
    } catch (error) {
        console.error('[PhotoSplitter] Error creating marker preview:', error);
        throw error;
    }
}
