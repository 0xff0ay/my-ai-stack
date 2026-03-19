<script setup lang="ts">
interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface Props {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  dragText?: string;
  dropText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  dragText: 'Drag files here or click to upload',
  dropText: 'Drop files here',
});

const emit = defineEmits<{
  select: [files: File[]];
  remove: [fileId: string];
  upload: [files: File[]];
}>();

const files = ref<FileInfo[]>([]);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement>();

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  
  if (props.disabled) return;
  
  const droppedFiles = Array.from(event.dataTransfer?.files || []);
  processFiles(droppedFiles);
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const selectedFiles = Array.from(target.files || []);
  processFiles(selectedFiles);
  target.value = '';
}

function processFiles(newFiles: File[]) {
  const validFiles = newFiles.filter(file => {
    if (props.maxSize && file.size > props.maxSize) {
      return false;
    }
    if (props.accept) {
      const accepted = props.accept.split(',').map(a => a.trim());
      const isAccepted = accepted.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return file.type === type || file.name.endsWith(type.replace('.', ''));
      });
      if (!isAccepted) return false;
    }
    return true;
  });
  
  const fileInfos: FileInfo[] = validFiles.map(file => ({
    id: Math.random().toString(36).substring(2),
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'pending',
  }));
  
  if (props.maxFiles && files.value.length + fileInfos.length > props.maxFiles) {
    fileInfos.splice(props.maxFiles - files.value.length);
  }
  
  files.value.push(...fileInfos);
  emit('select', validFiles.slice(0, fileInfos.length));
}

function removeFile(fileId: string) {
  files.value = files.value.filter(f => f.id !== fileId);
  emit('remove', fileId);
}

function clearFiles() {
  files.value = [];
}

function triggerUpload() {
  fileInput.value?.click();
}
</script>

<template>
  <div class="tui-upload">
    <div
      class="tui-upload-dropzone"
      :class="{ 
        'tui-upload-dragging': isDragging,
        'tui-upload-disabled': disabled 
      }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="triggerUpload"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled"
        class="tui-upload-input"
        @change="handleFileSelect"
      />
      
      <div class="tui-upload-content">
        <span class="tui-upload-icon">📁</span>
        <p class="tui-upload-text">
          {{ isDragging ? dropText : dragText }}
        </p>
        <p v-if="accept" class="tui-upload-hint">
          Accepted: {{ accept }}
        </p>
        <p v-if="maxSize" class="tui-upload-hint">
          Max size: {{ formatSize(maxSize) }}
        </p>
      </div>
    </div>
    
    <div v-if="files.length > 0" class="tui-upload-files">
      <div
        v-for="file in files"
        :key="file.id"
        class="tui-upload-file"
        :class="`tui-upload-file-${file.status}`"
      >
        <span class="tui-upload-file-icon">
          {{ file.type.startsWith('image/') ? '🖼️' : '📄' }}
        </span>
        
        <div class="tui-upload-file-info">
          <span class="tui-upload-file-name">{{ file.name }}</span>
          <span class="tui-upload-file-size">{{ formatSize(file.size) }}</span>
        </div>
        
        <div v-if="file.status === 'uploading' && file.progress !== undefined" class="tui-upload-file-progress">
          <div class="tui-upload-progress-bar" :style="{ width: `${file.progress}%` }" />
        </div>
        
        <span v-if="file.status === 'success'" class="tui-upload-file-status tui-upload-file-success">✓</span>
        <span v-if="file.status === 'error'" class="tui-upload-file-status tui-upload-file-error">✗</span>
        
        <button type="button" class="tui-upload-file-remove" @click="removeFile(file.id)">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-upload {
  font-family: var(--tui-font-mono);
}

.tui-upload-dropzone {
  border: 2px dashed var(--tui-border);
  border-radius: 4px;
  padding: var(--tui-spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: var(--tui-transition);
  background: var(--tui-bg-secondary);
}

.tui-upload-dropzone:hover:not(.tui-upload-disabled) {
  border-color: var(--tui-primary);
  background: rgba(0, 255, 255, 0.02);
}

.tui-upload-dragging {
  border-color: var(--tui-primary);
  background: rgba(0, 255, 255, 0.05);
}

.tui-upload-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tui-upload-input {
  display: none;
}

.tui-upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--tui-spacing-sm);
}

.tui-upload-icon {
  font-size: 2rem;
}

.tui-upload-text {
  margin: 0;
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-secondary);
}

.tui-upload-hint {
  margin: 0;
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
}

.tui-upload-files {
  margin-top: var(--tui-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--tui-spacing-sm);
}

.tui-upload-file {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: var(--tui-bg-tertiary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  position: relative;
}

.tui-upload-file-success {
  border-color: var(--tui-success);
}

.tui-upload-file-error {
  border-color: var(--tui-error);
}

.tui-upload-file-icon {
  flex-shrink: 0;
}

.tui-upload-file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tui-upload-file-name {
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tui-upload-file-size {
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
}

.tui-upload-file-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--tui-bg-primary);
}

.tui-upload-progress-bar {
  height: 100%;
  background: var(--tui-primary);
  transition: width 0.3s ease;
}

.tui-upload-file-status {
  font-weight: bold;
}

.tui-upload-file-success {
  color: var(--tui-success);
}

.tui-upload-file-error {
  color: var(--tui-error);
}

.tui-upload-file-remove {
  background: none;
  border: none;
  color: var(--tui-text-muted);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 4px;
  line-height: 1;
  transition: var(--tui-transition);
}

.tui-upload-file-remove:hover {
  color: var(--tui-error);
}
</style>
