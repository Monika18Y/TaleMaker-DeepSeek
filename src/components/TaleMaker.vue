<template>
  <div class="app-container">
    <!-- 导航栏 -->
    <header class="header">
      <h1>TaleMaker DS便捷小说生成器</h1>
    </header>

    <!-- 主体内容 -->
    <main class="main-content">
      <!-- 参数设置模块 -->
      <section class="module parameter-settings">
        <h2>参数设置</h2>
        <div class="module-content">
          <!-- API密钥设置 -->
          <div class="config-section api-config">
            <h3>🔑 API配置</h3>
            <div class="input-group">
              <label for="apiKey">DeepSeek API Key:</label>
              <div class="input-with-button">
                <input 
                  id="apiKey"
                  v-model="apiKey" 
                  :type="showApiKey ? 'text' : 'password'" 
                  placeholder="请输入您的DeepSeek API密钥"
                  class="input-field"
                />
                <button @click="toggleApiKeyVisibility" class="btn-secondary">
                  {{ showApiKey ? '隐藏' : '显示' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 基础设定 -->
          <div class="config-section basic-config">
            <h3>⚙️ 基础设定</h3>
            <div class="input-group">
              <label for="worldView">世界观设定:</label>
              <textarea 
                id="worldView"
                v-model="worldView" 
                placeholder="例如：这是一个奇幻的魔法世界，存在各种种族和魔法体系..."
                class="textarea-field"
                rows="3"
              ></textarea>
            </div>
            
            <div class="input-group">
              <label for="perspective">人称视角:</label>
              <select v-model="perspective" id="perspective" class="select-field">
                <option value="第一人称">第一人称</option>
                <option value="第二人称">第二人称</option>
                <option value="第三人称">第三人称</option>
                <option value="上帝视角">上帝视角</option>
              </select>
            </div>
            
            <div class="input-group">
              <label for="additionalInfo">其他信息:</label>
              <textarea 
                id="additionalInfo"
                v-model="additionalInfo" 
                placeholder="例如：语言风格偏向古典，注重环境描写和心理刻画..."
                class="textarea-field"
                rows="2"
              ></textarea>
            </div>
          </div>

          <!-- 章节配置 -->
          <div class="config-section chapter-config">
            <h3>📖 章节配置</h3>
            <div class="input-row">
              <div class="input-group">
                <label for="chapterNumber">第几章:</label>
                <input 
                  id="chapterNumber"
                  v-model.number="chapterNumber" 
                  type="number" 
                  min="1"
                  class="input-field"
                />
              </div>
              
              <div class="input-group">
                <label for="chapterName">章节命名:</label>
                <input 
                  id="chapterName"
                  v-model="chapterName" 
                  placeholder="可选，如：命运的相遇"
                  class="input-field"
                />
              </div>
            </div>

            <!-- 角色管理 -->
            <div class="input-group">
              <label>角色配置:</label>
              <div v-for="(character, index) in characters" :key="index" class="character-item">
                <input 
                  v-model="character.name"
                  placeholder="角色姓名"
                  class="input-field small"
                />
                <textarea 
                  v-model="character.setting"
                  placeholder="角色设定"
                  class="textarea-field small"
                  rows="2"
                ></textarea>
                <button @click="removeCharacter(index)" class="btn-danger">删除</button>
              </div>
              <button @click="addCharacter" class="btn-secondary">添加角色</button>
            </div>

            <!-- 情节要求 -->
            <div class="input-group">
              <label for="plotRequirement">情节要求:</label>
              <textarea 
                id="plotRequirement"
                v-model="plotRequirement" 
                placeholder="例如：主角在森林中遇到神秘老人，获得重要线索..."
                class="textarea-field"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 生成预览模块 -->
      <section class="module preview">
        <div class="module-header">
          <h2>生成预览</h2>
          <div class="header-actions">
            <button 
              @click="generateNovel" 
              :disabled="!canGenerate || isGenerating"
              class="btn-primary generate-btn"
            >
              {{ isGenerating ? '生成中...' : '生成小说章节' }}
            </button>
            <button 
              v-if="!isGenerating && currentContent"
              @click="toggleEditMode"
              class="btn-secondary"
            >
              {{ isEditing ? '退出编辑' : '编辑内容' }}
            </button>
          </div>
        </div>
        <div class="module-content">
          <!-- 生成状态指示器 -->
          <div v-if="isGenerating" class="generating-indicator">
            <div class="spinner"></div>
            <p>正在生成内容，请稍候...</p>
            <p class="stats">已生成 {{ currentStats.chineseCount }} 个中文字符</p>
          </div>
          
          <!-- 实时内容显示区域 -->
          <div class="preview-content" :class="{ 'generating': isGenerating, 'editing': isEditing }">
            <div class="content-display">
              <div class="content-header">
                <h3>{{ currentChapterTitle }}</h3>
                <div v-if="isEditing" class="edit-actions">
                  <button @click="saveEditedContent" class="btn-success small">保存修改</button>
                  <button @click="cancelEdit" class="btn-secondary small">取消</button>
                </div>
              </div>
              
              <!-- 编辑模式 -->
              <textarea 
                v-if="isEditing"
                v-model="editingContent"
                class="content-textarea"
                placeholder="请在此编辑小说内容..."
                rows="20"
              ></textarea>
              
              <!-- 阅读模式 -->
              <div v-else class="content-text" ref="contentText">
                <template v-if="isGenerating && displayedContent">
                  <span class="streaming-text">{{ displayedContent }}</span>
                  <span class="streaming-cursor">|</span>
                </template>
                <template v-else-if="currentContent">
                  {{ currentContent.content }}
                </template>
                <template v-else>
                  <div class="placeholder">
                    <div class="placeholder-icon">📝</div>
                    <p>生成的小说内容预览区域</p>
                    <p>设置好参数后点击生成按钮开始创作</p>
                  </div>
                </template>
              </div>
            </div>
            
            <!-- 统计信息 -->
            <div v-if="displayedContent || currentContent" class="content-stats">
              <p>总字符数: {{ currentStats.characterCount }} | 中文字符: {{ currentStats.chineseCount }}</p>
            </div>
            
            <!-- 操作按钮 -->
            <div v-if="!isGenerating && currentContent && !isEditing" class="preview-actions">
              <button @click="saveCurrentContent" class="btn-success">保存到历史</button>
              <button @click="clearCurrentContent" class="btn-secondary">清空预览</button>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 已生成内容查看模块 -->
      <section class="module history">
        <div class="module-header">
          <h2>已生成内容</h2>
          <button 
            v-if="history.length > 0"
            @click="downloadAllChapters"
            class="btn-primary"
          >
            下载全本
          </button>
        </div>
        <div class="module-content">
          <div v-if="history.length === 0" class="placeholder">
            <div class="placeholder-icon">📚</div>
            <p>暂无历史记录</p>
          </div>
          
          <div v-else class="history-list">
            <div 
              v-for="(item, index) in sortedHistory" 
              :key="index" 
              class="history-item"
              :class="{ 
                active: selectedHistoryIndex === index,
                edited: item.isEdited 
              }"
              @click="selectHistoryItem(index)"
            >
              <div class="history-item-header">
                <h4>{{ item.chapterTitle }}</h4>
                <span v-if="item.isEdited" class="edited-badge">已编辑</span>
              </div>
              <p class="preview-text">{{ getContentPreview(item.content) }}</p>
              <p class="meta-info">
                字符: {{ item.characterCount }} | 中文: {{ item.chineseCount }} | 
                {{ formatDate(item.timestamp) }}
              </p>
              <div class="history-actions">
                <button @click.stop="viewContent(item)" class="btn-secondary small">
                  查看
                </button>
                <button @click.stop="editHistoryItem(item, index)" class="btn-secondary small">
                  编辑
                </button>
                <button @click.stop="downloadContent(item)" class="btn-secondary small">
                  下载
                </button>
                <button @click.stop="deleteHistoryItem(index)" class="btn-danger small">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { generateContent, processStream, buildSystemConfig, buildUserConfig, countChineseCharacters } from './novelGenerator';

export default {
  name: 'NovelGenerator',
  data() {
    return {
      // API配置
      apiKey: '',
      showApiKey: false,
      
      // 基础设定
      worldView: '这是一个奇幻的魔法世界，存在各种种族和魔法体系...',
      perspective: '第三人称',
      additionalInfo: '语言风格偏向古典，注重环境描写和心理刻画...',
      
      // 章节配置
      chapterNumber: 1,
      chapterName: '',
      characters: [
        { name: '', setting: '' }
      ],
      plotRequirement: '',
      
      // 生成状态
      isGenerating: false,
      currentContent: null,
      displayedContent: '', // 实时显示的内容
      currentStats: {
        characterCount: 0,
        chineseCount: 0
      },
      
      // 编辑状态
      isEditing: false,
      editingContent: '',
      editingIndex: -1, // 正在编辑的历史项索引
      originalContent: '', // 编辑前的原始内容
      
      // 历史记录
      history: [],
      selectedHistoryIndex: -1
    };
  },
  computed: {
    canGenerate() {
      return this.apiKey && this.worldView && this.perspective && this.chapterNumber > 0;
    },
    currentChapterTitle() {
      if (this.currentContent) {
        return this.currentContent.chapterTitle;
      }
      return `第${this.chapterNumber}章${this.chapterName ? `: ${this.chapterName}` : ''}`;
    },
    sortedHistory() {
      // 按章节号排序
      return [...this.history].sort((a, b) => {
        const getChapterNum = (title) => {
          const match = title.match(/第(\d+)章/);
          return match ? parseInt(match[1]) : 0;
        };
        return getChapterNum(a.chapterTitle) - getChapterNum(b.chapterTitle);
      });
    }
  },
  mounted() {
    this.loadHistory();
  },
  methods: {
    // API密钥显示切换
    toggleApiKeyVisibility() {
      this.showApiKey = !this.showApiKey;
    },
    
    // 角色管理
    addCharacter() {
      this.characters.push({ name: '', setting: '' });
    },
    
    removeCharacter(index) {
      if (this.characters.length > 1) {
        this.characters.splice(index, 1);
      }
    },
    
    // 生成小说
    async generateNovel() {
      if (!this.canGenerate) return;
      
      this.isGenerating = true;
      this.currentContent = null;
      this.displayedContent = ''; // 清空显示内容
      this.currentStats = {
        characterCount: 0,
        chineseCount: 0
      };
      this.isEditing = false; // 退出编辑模式
      
      try {
        // 构建配置
        const systemConfig = buildSystemConfig(
          this.worldView,
          this.perspective,
          this.additionalInfo
        );
        
        const userConfig = buildUserConfig(
          this.chapterNumber,
          this.chapterName,
          this.plotRequirement,
          this.characters.filter(char => char.name || char.setting),
          this.getHistoryContext()
        );
        
        console.log('开始生成小说...', { systemConfig, userConfig });
        
        // 生成内容
        const stream = await generateContent({
          apiKey: this.apiKey,
          systemConfig,
          userConfig
        });
        
        // 处理流式响应
        const result = await processStream(stream, (update) => {
          // 实时更新统计信息
          this.currentStats = {
            characterCount: update.characterCount,
            chineseCount: update.chineseCount
          };
          
          // 实时更新显示内容
          this.displayedContent = update.content;
          
          // 自动滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        });
        
        if (result.success) {
          // 保存最终内容
          this.currentContent = {
            chapterTitle: `第${this.chapterNumber}章${this.chapterName ? `: ${this.chapterName}` : ''}`,
            content: result.finalContent,
            characterCount: result.characterCount,
            chineseCount: result.chineseCount,
            timestamp: new Date().toISOString(),
            isEdited: false,
            config: {
              worldView: this.worldView,
              perspective: this.perspective,
              characters: this.characters,
              plotRequirement: this.plotRequirement
            }
          };
          
          // 确保显示最终内容
          this.displayedContent = result.finalContent;
          console.log('生成完成', this.currentContent);
        } else {
          throw new Error(result.error || '生成失败');
        }
        
      } catch (error) {
        console.error('生成失败:', error);
        alert(`生成失败: ${error.message}`);
      } finally {
        this.isGenerating = false;
      }
    },
    
    // 滚动到底部
    scrollToBottom() {
      const contentElement = this.$refs.contentText;
      if (contentElement) {
        contentElement.scrollTop = contentElement.scrollHeight;
      }
    },
    
    // 获取历史上下文
    getHistoryContext() {
      if (this.history.length === 0) return '';
      
      return this.history
        .slice(-3)
        .map(item => `${item.chapterTitle}\n${item.content}`)
        .join('\n\n');
    },
    
    // 保存当前内容
    saveCurrentContent() {
      if (!this.currentContent) return;
      
      // 更新统计信息
      this.currentContent.characterCount = this.currentContent.content.length;
      this.currentContent.chineseCount = countChineseCharacters(this.currentContent.content);
      
      this.history.push({ ...this.currentContent });
      this.saveHistory();
      alert('保存成功！');
    },
    
    // 清空当前预览内容
    clearCurrentContent() {
      this.currentContent = null;
      this.displayedContent = '';
      this.isEditing = false;
      this.currentStats = {
        characterCount: 0,
        chineseCount: 0
      };
    },
    
    // 查看历史内容
    viewContent(content) {
      this.currentContent = { ...content };
      this.displayedContent = content.content;
      this.currentStats = {
        characterCount: content.characterCount,
        chineseCount: content.chineseCount
      };
      this.isEditing = false;
    },
    
    // 选择历史项
    selectHistoryItem(index) {
      this.selectedHistoryIndex = index;
      this.viewContent(this.sortedHistory[index]);
    },
    
    // 编辑历史项
    editHistoryItem(content, index) {
      this.currentContent = { ...content };
      this.displayedContent = content.content;
      this.editingContent = content.content;
      this.originalContent = content.content;
      this.editingIndex = index;
      this.isEditing = true;
      this.selectedHistoryIndex = index;
    },
    
    // 切换编辑模式
    toggleEditMode() {
      if (this.isEditing) {
        this.cancelEdit();
      } else {
        this.startEdit();
      }
    },
    
    // 开始编辑
    startEdit() {
      if (!this.currentContent) return;
      this.editingContent = this.currentContent.content;
      this.originalContent = this.currentContent.content;
      this.isEditing = true;
      this.editingIndex = -1; // 表示编辑的是当前预览内容，不是历史项
    },
    
    // 保存编辑内容
    saveEditedContent() {
      if (!this.editingContent.trim()) {
        alert('内容不能为空');
        return;
      }
      
      const characterCount = this.editingContent.length;
      const chineseCount = countChineseCharacters(this.editingContent);
      
      if (this.editingIndex >= 0) {
        // 更新历史项
        this.history[this.editingIndex] = {
          ...this.history[this.editingIndex],
          content: this.editingContent,
          characterCount: characterCount,
          chineseCount: chineseCount,
          isEdited: true,
          lastEdited: new Date().toISOString()
        };
        this.saveHistory();
        alert('修改已保存到历史记录！');
      } else {
        // 更新当前预览内容
        this.currentContent.content = this.editingContent;
        this.currentContent.characterCount = characterCount;
        this.currentContent.chineseCount = chineseCount;
        this.currentContent.isEdited = true;
        this.displayedContent = this.editingContent;
        alert('内容修改已保存！');
      }
      
      this.isEditing = false;
      this.currentStats = {
        characterCount: characterCount,
        chineseCount: chineseCount
      };
    },
    
    // 取消编辑
    cancelEdit() {
      this.isEditing = false;
      this.editingContent = '';
      this.originalContent = '';
      this.editingIndex = -1;
    },
    
    // 删除历史项
    deleteHistoryItem(index) {
      if (confirm('确定要删除这个章节吗？')) {
        this.history.splice(index, 1);
        this.saveHistory();
        if (this.selectedHistoryIndex === index) {
          this.selectedHistoryIndex = -1;
          this.clearCurrentContent();
        }
      }
    },
    
    // 下载单个章节
    downloadContent(content) {
      const blob = new Blob([content.content], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${content.chapterTitle}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    
    // 下载所有章节
    downloadAllChapters() {
      if (this.history.length === 0) {
        alert('没有可下载的章节');
        return;
      }
      
      // 按章节号排序
      const sortedChapters = this.sortedHistory;
      
      // 构建完整小说内容
      let fullContent = `《小说全本》\n\n`;
      fullContent += `生成时间: ${new Date().toLocaleString()}\n`;
      fullContent += `总章节数: ${sortedChapters.length}\n\n`;
      fullContent += '='.repeat(50) + '\n\n';
      
      sortedChapters.forEach((chapter, index) => {
        fullContent += `${chapter.chapterTitle}\n\n`;
        fullContent += chapter.content + '\n\n';
        fullContent += '='.repeat(50) + '\n\n';
        
        // 添加统计信息
        fullContent += `[本章统计: 字符数 ${chapter.characterCount} | 中文字符 ${chapter.chineseCount}`;
        if (chapter.isEdited) {
          fullContent += ' | 已编辑';
        }
        fullContent += ']\n\n';
      });
      
      // 添加总体统计
      const totalChars = sortedChapters.reduce((sum, chapter) => sum + chapter.characterCount, 0);
      const totalChinese = sortedChapters.reduce((sum, chapter) => sum + chapter.chineseCount, 0);
      
      fullContent += `\n总体统计:\n`;
      fullContent += `总章节数: ${sortedChapters.length}\n`;
      fullContent += `总字符数: ${totalChars}\n`;
      fullContent += `总中文字符: ${totalChinese}\n`;
      fullContent += `生成工具: TaleMaker DS便捷小说生成器\n`;
      
      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `小说全本_${sortedChapters.length}章.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    
    // 内容预览
    getContentPreview(content, length = 100) {
      return content.length > length ? content.substring(0, length) + '...' : content;
    },
    
    // 日期格式化
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    },
    
    // 本地存储
    saveHistory() {
      localStorage.setItem('novelHistory', JSON.stringify(this.history));
    },
    
    loadHistory() {
      const saved = localStorage.getItem('novelHistory');
      if (saved) {
        const history = JSON.parse(saved);
        // 兼容旧数据：添加 isEdited 字段
        this.history = history.map(item => ({
          ...item,
          isEdited: item.isEdited || false
        }));
      }
    }
  }
};
</script>

<style scoped>
/* 添加流式显示的特殊样式 */
.streaming-text {
  line-height: 1.8;
  font-family: 'Georgia', serif;
}

.streaming-cursor {
  animation: blink 1s infinite;
  color: #3498db;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 生成状态下的预览区域 */
.preview-content.generating .content-text {
  background: #f8f9fa;
  border: 2px dashed #e9ecef;
}

/* 编辑模式样式 */
.preview-content.editing {
  border: 2px solid #3498db;
  background: #f8fafc;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.content-textarea {
  width: 100%;
  min-height: 400px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: 'Georgia', serif;
  font-size: 15px;
  line-height: 1.8;
  resize: vertical;
  background: white;
}

.content-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* 确保内容区域可滚动 */
.content-text {
  max-height: 400px;
  overflow-y: auto;
  padding: 15px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #eaeaea;
  white-space: pre-wrap;
  font-size: 15px;
  line-height: 1.8;
  font-family: 'Georgia', serif;
}

/* 历史项编辑标识 */
.history-item.edited {
  border-left-color: #f39c12;
  background: #fef9f3;
}

.edited-badge {
  background: #f39c12;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-item-header h4 {
  margin: 0;
  flex: 1;
}

/* 头部操作按钮布局 */
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 12px;
}

.module-header h2 {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

/* 其他原有样式保持不变 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #f5f5f5;
}

.header {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2c3e50, #4a6572);
  color: white;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.module {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #eaeaea;
}

.module h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 12px;
  font-size: 1.4rem;
}

.module-content {
  min-height: 200px;
}

/* 配置区域样式 */
.config-section {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
  background: #f8fafc;
  border-left: 4px solid #3498db;
}

.config-section:last-child {
  margin-bottom: 0;
}

.config-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-config {
  border-left-color: #e74c3c;
  background: #fef5f5;
}

.basic-config {
  border-left-color: #f39c12;
  background: #fef9f3;
}

.chapter-config {
  border-left-color: #27ae60;
  background: #f3fcf7;
}

.input-group {
  margin-bottom: 18px;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.input-field, .textarea-field, .select-field {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
  background: white;
}

.input-field:focus, .textarea-field:focus, .select-field:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.textarea-field {
  resize: vertical;
  min-height: 60px;
  line-height: 1.5;
}

.input-field.small, .textarea-field.small {
  font-size: 13px;
}

.input-with-button {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input-with-button .input-field {
  flex: 1;
}

/* 角色项样式 */
.character-item {
  background: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #e1e8ed;
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 10px;
  align-items: start;
}

/* 按钮样式 */
.btn-primary, .btn-secondary, .btn-success, .btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  margin: 0 5px;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
  transform: translateY(-1px);
}

.btn-success {
  background: linear-gradient(135deg, #27ae60, #219a52);
  color: white;
}

.btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.btn-secondary.small, .btn-danger.small {
  padding: 6px 12px;
  font-size: 12px;
}

.generate-btn {
  min-width: 140px;
}

/* 生成指示器样式 */
.generating-indicator {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stats {
  color: #7f8c8d;
  font-size: 14px;
}

.preview-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-display {
  flex: 1;
  margin-bottom: 20px;
}

.content-display h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.content-stats {
  border-top: 1px solid #eee;
  padding-top: 12px;
  font-size: 14px;
  color: #7f8c8d;
  text-align: center;
}

.preview-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* 历史记录样式 */
.history-list {
  max-height: 600px;
  overflow-y: auto;
}

.history-item {
  background: #f8f9fa;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e1e8ed;
}

.history-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.history-item.active {
  border-left-color: #e74c3c;
  background: #e3f2fd;
  border-color: #3498db;
}

.history-item h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 15px;
}

.preview-text {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.meta-info {
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 12px;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #7f8c8d;
  text-align: center;
  padding: 40px 20px;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
  }
  
  .parameter-settings {
    grid-column: 1 / 3;
  }
}

@media (min-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr 2fr 1fr;
  }
  
  .parameter-settings {
    grid-column: auto;
  }
}

@media (max-width: 767px) {
  .input-row {
    grid-template-columns: 1fr;
  }
  
  .character-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .input-with-button {
    flex-direction: column;
  }
  
  .module-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .preview-actions {
    flex-direction: column;
  }
  
  .history-actions {
    flex-wrap: wrap;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .edit-actions {
    align-self: flex-end;
  }
}
</style>