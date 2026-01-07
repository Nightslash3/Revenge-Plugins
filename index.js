import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const uploadModule = findByProps("uploadFiles");

let patches = [];

export default {
    onLoad: () => {
        const patcher = before("uploadFiles", uploadModule, async (args) => {
            const [channelId, files, draftType, options] = args;
            
            if (!files || files.length <= 10) {
                return;
            }

            showToast(`Uploading ${files.length} images in batches of 10...`, "info");

            const batches = [];
            for (let i = 0; i < files.length; i += 10) {
                batches.push(files.slice(i, i + 10));
            }

            for (let i = 0; i < batches.length; i++) {
                await uploadModule.uploadFiles({
                    channelId,
                    files: batches[i],
                    draftType,
                    ...options
                });

                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            showToast(`Successfully uploaded ${files.length} images!`, "success");

            return [];
        });

        patches.push(patcher);
    },
    onUnload: () => {
        patches.forEach(p => p());
        patches = [];
    }
};
