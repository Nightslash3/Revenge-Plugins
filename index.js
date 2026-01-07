let unpatch;

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function uploadInBatches(channelId, files, messageContent) {
  const { findByProps } = vendetta.metro;
  const { showToast } = vendetta.ui.toasts;
  const UploadModule = findByProps("uploadFiles");
  const chunks = chunkArray(files, 10);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLastChunk = i === chunks.length - 1;
    const content = isLastChunk ? messageContent : "";
    
    try {
      await UploadModule.uploadFiles({
        channelId: channelId,
        files: chunk,
        draftType: 0,
        parsedMessage: { content }
      });
      
      if (chunks.length > 1) {
        showToast(`Uploaded batch ${i + 1}/${chunks.length}`, 1);
      }
    } catch (error) {
      showToast(`Failed to upload batch ${i + 1}: ${error.message}`, 2);
      return false;
    }
  }
  
  return true;
}

module.exports = {
  onLoad: () => {
    const { findByProps } = vendetta.metro;
    const { after } = vendetta.patcher;
    const { showToast } = vendetta.ui.toasts;
    const UploadModule = findByProps("uploadFiles");
    
    unpatch = after("uploadFiles", UploadModule, async (args, result) => {
      const [uploadData] = args;
      const { files, channelId } = uploadData;
      
      if (files && files.length > 10) {
        const messageContent = uploadData.parsedMessage?.content || "";
        
        showToast(`Uploading ${files.length} images in batches...`, 0);
        
        const success = await uploadInBatches(channelId, files, messageContent);
        
        if (success) {
          showToast(`Successfully uploaded all ${files.length} images!`, 1);
        }
        
        return null;
      }
      
      return result;
    });
  },
  onUnload: () => {
    unpatch?.();
  }
};
