<template>
  <div class="app-container">
    <!-- 导航栏 -->
    <header class="header">
      <h1>DeepSeek 无限制小说生成框架</h1>
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
                  placeholder="请输入您的key"
                  class="input-field"
                />
                <button @click="toggleApiKeyVisibility" class="btn-secondary">
                  {{ showApiKey ? '隐藏' : '显示' }}
                </button>
                <button @click="goToGetAPIKey" class="btn-secondary get-key-btn">
                  获取密钥
                </button>
              </div>
            </div>
            
            <!-- 新增：模型配置 -->
            <div class="input-group">
              <label for="model">模型选择:</label>
              <select v-model="model" id="model" class="select-field">
                <option value="deepseek-reasoner">DeepSeek Reasoner (支持思考过程)</option>
                <option value="deepseek-chat">DeepSeek Chat (常规版)</option>
              </select>
            </div>
            
            <!-- 新增：思维链开关 -->
            <div class="input-group">
              <div class="checkbox-group">
                <input 
                  id="enableReasoning"
                  v-model="enableReasoning" 
                  type="checkbox"
                  class="checkbox-input"
                  :disabled="model !== 'deepseek-reasoner'"
                />
                <label for="enableReasoning" class="checkbox-label">
                  启用思维链 (展示模型思考过程)
                  <br></br>
                  <span v-if="model !== 'deepseek-reasoner'" class="disabled-hint">
                    (仅DeepSeek Reasoner模型支持)
                  </span>
                </label>
              </div>
            </div>
            
            <!-- 新增：思维链显示选项 -->
            <div v-if="enableReasoning && model === 'deepseek-reasoner'" class="input-group">
              <label for="reasoningDisplay">思维链显示方式:</label>
              <select v-model="reasoningDisplay" id="reasoningDisplay" class="select-field">
                <option value="separate">独立显示</option>
                <option value="combined">合并显示</option>
                <option value="hide">隐藏思维</option>
              </select>
            </div>
          </div>

          <!-- 基础设定 -->
          <div class="config-section basic-config">
            <h3>⚙️ 基础设定</h3>

            <div class="input-group">
              <label for="perspective">人称视角:</label>
              <select v-model="perspective" id="perspective" class="select-field">
                <option value="第一人称">第一人称</option>
                <option value="第二人称">第二人称</option>
                <option value="第三人称">第三人称</option>
              </select>
            </div>

            <div class="input-group">
              <label for="worldView">世界观设定:</label>
              <textarea 
                id="worldView"
                v-model="worldView" 
                @input="autoResize($event, 60, 400)"
                placeholder="架空/现实/修仙 可详细设定"
                class="textarea-field auto-resize"
              ></textarea>
            </div>
            
            <div class="input-group">
              <label for="additionalInfo">其他信息:</label>
              <textarea 
                id="additionalInfo"
                v-model="additionalInfo" 
                @input="autoResize($event, 60, 400)"
                placeholder="语言风格/特殊用词等其他要求"
                class="textarea-field auto-resize"
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
                  class="input-field"
                />
              </div>
            </div>

            <!-- 角色管理 -->
            <div class="input-group">
              <label>角色配置:</label>
              <div v-for="(character, index) in characters" :key="index" class="character-juese">
                <input 
                  v-model="character.name"
                  placeholder="角色姓名"
                  class="input-field small"
                />
    
                <textarea 
                  v-model="character.setting"
                  @input="autoResize($event, 60, 200)"
                  placeholder="角色设定"
                  class="textarea-field small auto-resize"
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
                @input="autoResize($event, 100, 500)"
                placeholder="例如：主角在森林中遇到神秘老人，获得重要线索..."
                class="textarea-field auto-resize"
              ></textarea>
            </div>

            <!-- 参数管理按钮 -->
            <div class="input-group">
              <div class="parameter-actions">
                <button @click="saveCurrentParameters" class="btn-secondary">
                  保存当前参数
                </button>
                <button @click="resetParameters" class="btn-danger">
                  重置参数
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 生成预览模块 -->
      <section class="module preview">
        <div class="module-header">
          <h2>生成预览</h2>
          <div class="header-actions">
            <!-- 生成状态提示（悬浮） -->
            <transition name="fade">
              <div v-if="isGenerating" class="floating-generating-indicator">
                <div class="generating-progress">
                  <div class="progress-spinner"></div>
                  <div class="progress-text">
                    <p class="generating-title">正在生成小说内容...</p>
                    <p class="generating-stats">
                      已生成: <span class="stat-value">{{ currentStats.chineseCount }}</span> 中文字符
                      <span v-if="enableReasoning">
                        | 思维链: <span class="stat-value">{{ reasoningStats.length }}</span> 字符
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </transition>
            
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
          <!-- 导入状态指示器 -->
          <div v-if="isImporting" class="importing-indicator">
            <div class="spinner"></div>
            <p>正在导入数据，请稍候...</p>
          </div>
          
          <!-- 内容选项卡 -->
          <div class="content-tabs" v-if="availableTabs.length > 1">
            <button 
              v-for="tab in availableTabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="{ active: activeTab === tab.id, disabled: !tab.available }"
              class="tab-button"
            >
              {{ tab.label }}
              <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
            </button>
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
              
              <!-- 最终内容视图 -->
              <div v-if="activeTab === 'final' && !isEditing" class="content-view">
                <template v-if="isGenerating && displayedContent">
                  <div class="streaming-content">
                    <span class="streaming-text">{{ displayedContent }}</span>
                    <span class="streaming-cursor">|</span>
                  </div>
                </template>
                <template v-else-if="currentContent">
                  <div class="content-text" ref="contentText">
                    {{ currentContent.content }}
                  </div>
                </template>
                <template v-else>
                  <div class="placeholder">
                    <div class="placeholder-icon">📝</div>
                    <p>生成的小说内容预览区域</p>
                    <p>设置好参数后点击生成按钮开始创作</p>
                  </div>
                </template>
              </div>
              
              <!-- 思维链视图 -->
              <div v-if="activeTab === 'reasoning' && !isEditing" class="reasoning-view">
                <template v-if="isGenerating && displayedReasoning">
                  <div class="streaming-reasoning">
                    <span class="streaming-text reasoning-text">{{ displayedReasoning }}</span>
                    <span class="streaming-cursor">|</span>
                  </div>
                </template>
                <template v-else-if="currentReasoning">
                  <div class="reasoning-text" ref="reasoningText">
                    {{ currentReasoning }}
                  </div>
                </template>
                <template v-else>
                  <div class="placeholder">
                    <div class="placeholder-icon">🤔</div>
                    <p>模型思考过程将显示在这里</p>
                    <p>需要启用思维链功能</p>
                  </div>
                </template>
              </div>
              
              <!-- 合并视图 -->
              <div v-if="activeTab === 'combined' && !isEditing" class="combined-view">
                <template v-if="isGenerating">
                  <div class="combined-content">
                    <div class="combined-section">
                      <h4>模型思考过程</h4>
                      <div class="streaming-reasoning">
                        <span class="streaming-text reasoning-text">{{ displayedReasoning }}</span>
                        <span class="streaming-cursor">|</span>
                      </div>
                    </div>
                    <div class="combined-divider"></div>
                    <div class="combined-section">
                      <h4>生成内容</h4>
                      <div class="streaming-content">
                        <span class="streaming-text">{{ displayedContent }}</span>
                        <span class="streaming-cursor">|</span>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="hasCombinedContent">
                  <div class="combined-content">
                    <div class="combined-section">
                      <h4>模型思考过程</h4>
                      <div class="reasoning-text">
                        {{ currentReasoning }}
                      </div>
                    </div>
                    <div class="combined-divider"></div>
                    <div class="combined-section">
                      <h4>生成内容</h4>
                      <div class="content-text">
                        {{ currentContent.content }}
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              
              <!-- 编辑模式 -->
              <textarea 
                v-if="isEditing"
                v-model="editingContent"
                @input="autoResize($event, 400, 800)"
                class="content-textarea auto-resize"
                placeholder="请在此编辑小说内容..."
              ></textarea>
            </div>
            
            <!-- 统计信息 -->
            <div v-if="displayedContent || currentContent" class="content-stats">
              <p>
                总字符数: {{ currentStats.characterCount }} | 
                中文字符: {{ currentStats.chineseCount }}
                <span v-if="reasoningStats.length > 0">
                  | 思维链: {{ reasoningStats.length }} 字符
                </span>
              </p>
            </div>
            
            <!-- 操作按钮 -->
            <div v-if="!isGenerating && currentContent && !isEditing" class="preview-actions">
              <button @click="saveCurrentContent" class="btn-success">保存到历史</button>
              <button @click="clearCurrentContent" class="btn-secondary">清空预览</button>
              <button 
                v-if="currentReasoning"
                @click="downloadReasoning"
                class="btn-secondary"
              >
                下载思维链
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 已生成内容查看模块 -->
      <section class="module history">
        <div class="module-header">
          <h2>已生成内容</h2>
          <div class="header-actions">
            <button 
              v-if="history.length > 0"
              @click="downloadAllChapters"
              class="btn-primary"
            >
              下载全本
            </button>
            <button 
              @click="importAllChapters"
              class="btn-secondary"
            >
              导入全本
            </button>
          </div>
        </div>
        <div class="module-content">
          <div v-if="history.length === 0" class="placeholder">
            <div class="placeholder-icon">📚</div>
            <p>暂无历史记录</p>
            <p>生成的章节将显示在这里</p>
          </div>
          
          <div v-else class="history-list">
            <div 
              v-for="(item, index) in sortedHistory" 
              :key="index" 
              class="history-item"
              :class="{ 
                active: selectedHistoryIndex === index,
                edited: item.isEdited,
                imported: item.imported,
                hasReasoning: item.reasoningContent
              }"
              @click="selectHistoryItem(index)"
            >
              <div class="history-item-header">
                <h4>{{ item.chapterTitle }}</h4>
                <div class="item-badges">
                  <span v-if="item.isEdited" class="edited-badge">已编辑</span>
                  <span v-if="item.imported" class="imported-badge">已导入</span>
                  <span v-if="item.reasoningContent" class="reasoning-badge">有思维链</span>
                </div>
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
                <button 
                  v-if="item.reasoningContent"
                  @click.stop="viewReasoning(item)"
                  class="btn-secondary small"
                >
                  查看思维链
                </button>
                <button @click.stop="editHistoryItem(item, index)" class="btn-secondary small">
                  编辑
                </button>
                <button @click.stop="downloadContent(item)" class="btn-secondary small">
                  下载
                </button>
                <button 
                  v-if="item.reasoningContent"
                  @click.stop="downloadReasoningOnly(item)"
                  class="btn-secondary small"
                >
                  下载思维链
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
import { 
  generateContent, 
  processStream, 
  buildSystemConfig, 
  buildUserConfig, 
  countChineseCharacters,
  combineReasoningAndContent 
} from './novelGenerator';

export default {
  name: 'NovelGenerator',
  data() {
    return {
      // API配置
      apiKey: '',
      showApiKey: false,
      model: 'deepseek-reasoner',
      enableReasoning: true,
      reasoningDisplay: 'separate',
      
      // 基础设定
      worldView: '',
      perspective: '第三人称',
      additionalInfo: '',
      
      // 章节配置
      chapterNumber: 1,
      chapterName: '',
      characters: [
        { name: '', setting: '' }
      ],
      plotRequirement: '',
      
      // 生成状态
      isGenerating: false,
      generationProgress: 0, // 新增：生成进度
      generationTimer: null, // 新增：进度计时器
      currentContent: null,
      currentReasoning: '', // 新增：存储思维链内容
      displayedContent: '', // 实时显示的内容
      displayedReasoning: '', // 新增：实时显示的思维链内容
      activeTab: 'final', // 当前激活的选项卡
      currentStats: {
        characterCount: 0,
        chineseCount: 0
      },
      reasoningStats: {
        length: 0
      },
      
      // 编辑状态
      isEditing: false,
      editingContent: '',
      editingIndex: -1, // 正在编辑的历史项索引
      originalContent: '', // 编辑前的原始内容
      
      // 历史记录
      history: [],
      selectedHistoryIndex: -1,
      
      // 新增：参数版本控制
      parametersVersion: '1.1', // 更新版本号以支持思维链
      
      // 新增：导入文件相关
      isImporting: false
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
    },
    availableTabs() {
      const tabs = [];
      
      // 根据显示方式决定显示的选项卡
      if (this.reasoningDisplay === 'combined') {
        // 合并显示：只显示合并视图
        if (this.currentContent && this.currentReasoning) {
          tabs.push({ id: 'combined', label: '合并视图', available: true });
        } else if (this.isGenerating) {
          tabs.push({ id: 'combined', label: '合并视图', available: true });
        }
      } else if (this.reasoningDisplay === 'hide') {
        // 隐藏思维链：只显示最终内容
        tabs.push({ id: 'final', label: '最终内容', available: true });
      } else {
        // 单独显示：显示最终内容和思维链
        tabs.push({ id: 'final', label: '最终内容', available: true });
        if (this.currentReasoning || this.isGenerating) {
          tabs.push({ id: 'reasoning', label: '思维链', available: !!this.currentReasoning });
        }
      }
      
      return tabs;
    },
    hasMultipleViews() {
      return this.availableTabs.length > 1;
    },
    hasCombinedContent() {
      return this.currentContent && this.currentReasoning;
    }
  },
  watch: {
    // 监听模型变化，如果模型不是reasoner，则禁用思维链
    model(newModel) {
      if (newModel !== 'deepseek-reasoner') {
        this.enableReasoning = false;
        this.reasoningDisplay = 'separate';
      } else {
        this.enableReasoning = true;
      }
    },
    
    // 监听思维链显示方式变化
    reasoningDisplay(newValue) {
      // 根据显示方式自动切换选项卡
      if (newValue === 'combined') {
        this.activeTab = 'combined';
      } else if (newValue === 'hide') {
        this.activeTab = 'final';
      } else {
        this.activeTab = 'final';
      }
    },
    
    // 监听主要参数变化并自动保存
    worldView(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
        // 自动调整高度
        this.$nextTick(() => {
          this.initTextareaHeights();
        });
      }
    },
    perspective(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    additionalInfo(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
        // 自动调整高度
        this.$nextTick(() => {
          this.initTextareaHeights();
        });
      }
    },
    chapterNumber(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    chapterName(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    plotRequirement(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
        // 自动调整高度
        this.$nextTick(() => {
          this.initTextareaHeights();
        });
      }
    },
    characters: {
      handler(newVal) {
        if (newVal !== undefined) {
          this.debouncedSaveParameters();
          // 自动调整角色设定框高度
          this.$nextTick(() => {
            this.initTextareaHeights();
          });
        }
      },
      deep: true
    },
    model(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    enableReasoning(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    reasoningDisplay(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    
    // 监听生成状态
    isGenerating(isGenerating) {
      if (isGenerating) {
        this.startGenerationProgress();
      } else {
        this.stopGenerationProgress();
      }
    }
  },
  mounted() {
    this.loadHistory();
    this.loadAllParameters();
    // 初始化所有自动调整的textarea高度
    this.$nextTick(() => {
      this.initTextareaHeights();
    });
  },
  created() {
    // 创建防抖的保存函数
    this.debouncedSaveParameters = this.debounce(() => {
      this.saveAllParameters();
    }, 1000);
  },
  methods: {
    // 自动调整textarea高度
    autoResize(event, minHeight = 60, maxHeight = 400) {
      const textarea = event.target;
      
      // 保存当前滚动位置（防止页面跳动）
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // 重置高度以便正确计算scrollHeight
      textarea.style.height = 'auto';
      
      // 计算新高度
      let newHeight = textarea.scrollHeight + 2;
      newHeight = Math.max(minHeight, newHeight);
      newHeight = Math.min(maxHeight, newHeight);
      
      // 应用新高度
      textarea.style.height = `${newHeight}px`;
      
      // 控制滚动条显示
      if (newHeight >= maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
      
      // 恢复滚动位置
      window.scrollTo(0, scrollTop);
    },
    
    // 初始化所有textarea高度
    initTextareaHeights() {
      this.$nextTick(() => {
        const textareas = document.querySelectorAll('.auto-resize');
        textareas.forEach(textarea => {
          // 模拟input事件以触发调整
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        });
      });
    },
    
    // 防抖函数
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    // 开始生成进度动画
    startGenerationProgress() {
      this.generationProgress = 10;
      if (this.generationTimer) {
        clearInterval(this.generationTimer);
      }
      
      this.generationTimer = setInterval(() => {
        if (this.generationProgress < 90) {
          this.generationProgress += 5;
        }
      }, 500);
    },
    
    // 停止生成进度动画
    stopGenerationProgress() {
      if (this.generationTimer) {
        clearInterval(this.generationTimer);
        this.generationTimer = null;
      }
      // 完成后动画到100%
      if (this.generationProgress < 100) {
        const interval = setInterval(() => {
          if (this.generationProgress < 100) {
            this.generationProgress += 5;
          } else {
            clearInterval(interval);
            setTimeout(() => {
              this.generationProgress = 0;
            }, 500);
          }
        }, 50);
      }
    },
    
    // API密钥显示切换
    toggleApiKeyVisibility() {
      this.showApiKey = !this.showApiKey;
    },
    
    // 跳转到获取API密钥页面
    goToGetAPIKey() {
      window.open('https://platform.deepseek.com/usage', '_blank');
    },
    
    // 角色管理
    addCharacter() {
      this.characters.push({ name: '', setting: '' });
      // 添加角色后自动调整高度
      this.$nextTick(() => {
        this.initTextareaHeights();
      });
    },
    
    removeCharacter(index) {
      if (this.characters.length > 1) {
        this.characters.splice(index, 1);
      }
    },
    
    // 保存所有参数到本地存储
    saveAllParameters() {
      const parameters = {
        version: this.parametersVersion,
        apiKey: this.apiKey,
        model: this.model,
        enableReasoning: this.enableReasoning,
        reasoningDisplay: this.reasoningDisplay,
        worldView: this.worldView,
        perspective: this.perspective,
        additionalInfo: this.additionalInfo,
        chapterNumber: this.chapterNumber,
        chapterName: this.chapterName,
        characters: JSON.parse(JSON.stringify(this.characters)),
        plotRequirement: this.plotRequirement,
        savedAt: new Date().toISOString()
      };
      
      try {
        localStorage.setItem('novelParameters', JSON.stringify(parameters));
        console.log('参数已保存到本地存储');
      } catch (error) {
        console.error('保存参数失败:', error);
      }
    },
    
    // 手动保存当前参数
    saveCurrentParameters() {
      this.saveAllParameters();
      alert('参数已保存！');
    },
    
    // 重置参数
    resetParameters() {
      if (confirm('确定要重置所有参数吗？这将清除当前的配置。')) {
        this.worldView = '';
        this.perspective = '第三人称';
        this.additionalInfo = '';
        this.chapterNumber = 1;
        this.chapterName = '';
        this.characters = [{ name: '', setting: '' }];
        this.plotRequirement = '';
        this.model = 'deepseek-reasoner';
        this.enableReasoning = true;
        this.reasoningDisplay = 'separate';
        
        // 清除本地存储的参数
        localStorage.removeItem('novelParameters');
        
        // 重置后调整textarea高度
        this.$nextTick(() => {
          this.initTextareaHeights();
        });
        
        alert('参数已重置！');
      }
    },
    
    // 加载保存的参数
    loadAllParameters() {
      try {
        const saved = localStorage.getItem('novelParameters');
        if (saved) {
          const parameters = JSON.parse(saved);
          
          // 检查版本兼容性
          if (parameters.version === this.parametersVersion) {
            this.apiKey = parameters.apiKey || '';
            this.model = parameters.model || 'deepseek-reasoner';
            this.enableReasoning = parameters.enableReasoning !== undefined ? parameters.enableReasoning : true;
            this.reasoningDisplay = parameters.reasoningDisplay || 'separate';
            this.worldView = parameters.worldView || '';
            this.perspective = parameters.perspective || '第三人称';
            this.additionalInfo = parameters.additionalInfo || '';
            this.chapterNumber = parameters.chapterNumber || 1;
            this.chapterName = parameters.chapterName || '';
            this.characters = parameters.characters && parameters.characters.length > 0 
              ? parameters.characters 
              : [{ name: '', setting: '' }];
            this.plotRequirement = parameters.plotRequirement || '';
            
            // 根据配置设置默认激活的选项卡
            if (this.reasoningDisplay === 'combined') {
              this.activeTab = 'combined';
            } else if (this.reasoningDisplay === 'hide') {
              this.activeTab = 'final';
            }
            
            console.log('参数已从本地存储加载');
            
            // 加载参数后调整textarea高度
            this.$nextTick(() => {
              this.initTextareaHeights();
            });
            
            return true;
          } else {
            console.warn('参数版本不兼容，使用默认参数');
          }
        }
      } catch (error) {
        console.error('加载参数失败:', error);
      }
      return false;
    },
    
    // 生成小说
    async generateNovel() {
      if (!this.canGenerate) return;
      
      // 在生成前保存参数
      this.saveAllParameters();
      
      this.isGenerating = true;
      this.currentContent = null;
      this.currentReasoning = '';
      this.displayedContent = '';
      this.displayedReasoning = '';
      this.currentStats = {
        characterCount: 0,
        chineseCount: 0
      };
      this.reasoningStats = {
        length: 0
      };
      this.isEditing = false;
      
      // 根据显示方式设置初始选项卡
      if (this.reasoningDisplay === 'combined') {
        this.activeTab = 'combined';
      } else if (this.reasoningDisplay === 'hide') {
        this.activeTab = 'final';
      } else {
        this.activeTab = 'final';
      }
      
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
        
        console.log('开始生成小说...', { 
          systemConfig, 
          userConfig,
          model: this.model,
          enableReasoning: this.enableReasoning
        });
        
        // 生成内容
        const stream = await generateContent({
          apiKey: this.apiKey,
          systemConfig,
          userConfig,
          model: this.model,
          enableReasoning: this.enableReasoning
        });
        
        // 处理流式响应
        const result = await processStream(stream, (update) => {
          // 更新统计信息
          this.currentStats = {
            characterCount: update.characterCount,
            chineseCount: update.chineseCount
          };
          
          // 更新思维链统计
          if (update.reasoningContent) {
            this.reasoningStats.length = update.reasoningContent.length;
          }
          
          // 实时更新显示内容
          this.displayedContent = update.content;
          
          // 实时更新思维链内容
          if (update.reasoningContent) {
            this.displayedReasoning = update.reasoningContent;
          }
          
          // 更新生成进度（基于内容长度）
          if (update.characterCount > 0) {
            this.generationProgress = Math.min(95, 10 + (update.characterCount / 2000) * 85);
          }
          
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
              plotRequirement: this.plotRequirement,
              model: this.model,
              enableReasoning: this.enableReasoning
            }
          };
          
          // 保存思维链内容
          if (result.reasoningContent) {
            this.currentReasoning = result.reasoningContent;
            
            // 如果启用了合并显示，且用户选择了合并视图，创建合并内容
            if (this.reasoningDisplay === 'combined') {
              this.activeTab = 'combined';
            }
          }
          
          // 确保显示最终内容
          this.displayedContent = result.finalContent;
          this.displayedReasoning = result.reasoningContent || '';
          
          // 设置生成进度为完成
          this.generationProgress = 100;
          
          console.log('生成完成', this.currentContent);
          console.log('思维链长度:', result.reasoningContent ? result.reasoningContent.length : 0);
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
      const contentElement = this.$refs.contentText || this.$refs.reasoningText;
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
      
      // 保存思维链内容
      if (this.currentReasoning) {
        this.currentContent.reasoningContent = this.currentReasoning;
      }
      
      this.history.push({ ...this.currentContent });
      this.saveHistory();
      alert('保存成功！');
    },
    
    // 清空当前预览内容
    clearCurrentContent() {
      this.currentContent = null;
      this.currentReasoning = '';
      this.displayedContent = '';
      this.displayedReasoning = '';
      this.isEditing = false;
      // 根据当前显示方式重置选项卡
      if (this.reasoningDisplay === 'combined') {
        this.activeTab = 'combined';
      } else {
        this.activeTab = 'final';
      }
      this.currentStats = {
        characterCount: 0,
        chineseCount: 0
      };
      this.reasoningStats = {
        length: 0
      };
    },
    
    // 查看历史内容
    viewContent(content) {
      this.currentContent = { ...content };
      this.displayedContent = content.content;
      this.currentReasoning = content.reasoningContent || '';
      this.currentStats = {
        characterCount: content.characterCount,
        chineseCount: content.chineseCount
      };
      this.isEditing = false;
      
      // 根据当前显示方式决定显示哪个选项卡
      if (this.reasoningDisplay === 'combined' && this.currentReasoning) {
        this.activeTab = 'combined';
      } else {
        this.activeTab = 'final';
      }
    },
    
    // 查看思维链内容
    viewReasoning(content) {
      if (content.reasoningContent) {
        this.currentContent = { ...content };
        this.currentReasoning = content.reasoningContent;
        this.displayedReasoning = content.reasoningContent;
        this.isEditing = false;
        this.activeTab = 'reasoning';
      }
    },
    
    // 选择历史项
    selectHistoryItem(index) {
      this.selectedHistoryIndex = index;
      const content = this.sortedHistory[index];
      this.viewContent(content);
    },
    
    // 编辑历史项
    editHistoryItem(content, index) {
      this.currentContent = { ...content };
      this.displayedContent = content.content;
      this.currentReasoning = content.reasoningContent || '';
      this.editingContent = content.content;
      this.originalContent = content.content;
      this.editingIndex = index;
      this.isEditing = true;
      this.selectedHistoryIndex = index;
      this.activeTab = 'final';
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
      this.editingIndex = -1;
      this.activeTab = 'final';
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
    
    // 下载思维链
    downloadReasoning() {
      if (!this.currentReasoning) {
        alert('没有可下载的思维链内容');
        return;
      }
      
      const blob = new Blob([this.currentReasoning], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${this.currentChapterTitle}_思维链.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    
    // 仅下载思维链
    downloadReasoningOnly(content) {
      if (!content.reasoningContent) {
        alert('该章节没有思维链内容');
        return;
      }
      
      const blob = new Blob([content.reasoningContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${content.chapterTitle}_思维链.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    
    // 下载所有章节
    downloadAllChapters() {
      if (this.history.length === 0) {
        alert('没有可下载的章节');
        return;
      }
      
      // 询问导出格式
      const format = confirm('是否导出为JSON格式（包含参数和历史记录）？\n点击"确定"导出JSON，点击"取消"导出TXT')
        ? 'json'
        : 'txt';
      
      if (format === 'json') {
        this.downloadAsJson();
      } else {
        this.downloadAsTxt();
      }
    },
    
    // 导出为JSON格式
    downloadAsJson() {
      const exportData = {
        format: 'novel-full-export',
        version: '1.1', // 更新版本号
        exportedAt: new Date().toISOString(),
        generator: 'TaleMaker DS便捷小说生成器',
        
        // 包含当前参数
        parameters: {
          apiKey: '', // 出于安全考虑，不导出API密钥
          model: this.model,
          enableReasoning: this.enableReasoning,
          reasoningDisplay: this.reasoningDisplay,
          worldView: this.worldView,
          perspective: this.perspective,
          additionalInfo: this.additionalInfo,
          chapterNumber: this.chapterNumber,
          chapterName: this.chapterName,
          characters: JSON.parse(JSON.stringify(this.characters)),
          plotRequirement: this.plotRequirement
        },
        
        // 包含所有历史记录
        history: this.sortedHistory.map(item => ({
          chapterTitle: item.chapterTitle,
          content: item.content,
          reasoningContent: item.reasoningContent || '', // 新增思维链内容
          characterCount: item.characterCount,
          chineseCount: item.chineseCount,
          timestamp: item.timestamp,
          isEdited: item.isEdited || false,
          imported: item.imported || false,
          config: item.config || {}
        })),
        
        // 统计信息
        statistics: {
          totalChapters: this.history.length,
          totalCharacters: this.history.reduce((sum, item) => sum + item.characterCount, 0),
          totalChineseCharacters: this.history.reduce((sum, item) => sum + item.chineseCount, 0),
          chaptersWithReasoning: this.history.filter(item => item.reasoningContent).length
        }
      };
      
      // 创建JSON字符串
      const jsonStr = JSON.stringify(exportData, null, 2);
      
      // 创建下载
      const blob = new Blob([jsonStr], { 
        type: 'application/json;charset=utf-8' 
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `小说全本_${this.history.length}章_${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      alert('已导出JSON格式全本，可后续导入恢复数据');
    },
    
    // 原有的TXT格式导出
    downloadAsTxt() {
      const sortedChapters = this.sortedHistory;
      
      let fullContent = `《小说全本》\n\n`;
      fullContent += `生成时间: ${new Date().toLocaleString()}\n`;
      fullContent += `总章节数: ${sortedChapters.length}\n`;
      fullContent += `生成工具: TaleMaker DS便捷小说生成器\n`;
      fullContent += `包含思维链的章节数: ${sortedChapters.filter(c => c.reasoningContent).length}\n\n`;
      fullContent += '='.repeat(50) + '\n\n';
      
      sortedChapters.forEach((chapter, index) => {
        fullContent += `${chapter.chapterTitle}\n\n`;
        
        // 如果章节有思维链，可以选择包含
        if (chapter.reasoningContent && confirm(`章节"${chapter.chapterTitle}"有思维链内容，是否包含在导出文件中？`)) {
          fullContent += `【模型思考过程】\n${chapter.reasoningContent}\n\n`;
          fullContent += `【生成内容】\n`;
        }
        
        fullContent += chapter.content + '\n\n';
        fullContent += '='.repeat(50) + '\n\n';
        
        // 添加统计信息
        fullContent += `[本章统计: 字符数 ${chapter.characterCount} | 中文字符 ${chapter.chineseCount}`;
        if (chapter.isEdited) {
          fullContent += ' | 已编辑';
        }
        if (chapter.imported) {
          fullContent += ' | 已导入';
        }
        if (chapter.reasoningContent) {
          fullContent += ' | 有思维链';
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
      fullContent += `包含思维链的章节数: ${sortedChapters.filter(c => c.reasoningContent).length}\n`;
      
      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `小说全本_${sortedChapters.length}章.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    
    // 导入全本功能
    importAllChapters() {
      // 创建文件输入元素
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.txt';
      input.style.display = 'none';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        this.isImporting = true;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            this.processImportedFile(content, file.name);
          } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败: ' + error.message);
          } finally {
            this.isImporting = false;
            // 清理输入元素
            document.body.removeChild(input);
          }
        };
        
        reader.onerror = () => {
          alert('读取文件失败');
          this.isImporting = false;
          document.body.removeChild(input);
        };
        
        reader.readAsText(file);
      };
      
      document.body.appendChild(input);
      input.click();
    },
    
    // 处理导入的文件
    processImportedFile(content, filename) {
      try {
        // 尝试解析为JSON
        const data = JSON.parse(content);
        
        // 检查数据格式
        if (data.format === 'novel-full-export') {
          // 导入全本格式
          this.importFullNovelData(data);
        } else if (data.parameters) {
          // 可能是旧版格式，尝试导入参数
          this.importLegacyFormat(data);
        } else {
          // 可能是纯文本，作为单个章节导入
          this.importAsSingleChapter(content, filename);
        }
      } catch (jsonError) {
        // JSON解析失败，作为纯文本导入
        console.log('非JSON格式，尝试作为文本导入');
        this.importAsSingleChapter(content, filename);
      }
    },
    
    // 导入全本数据（新版格式）
    importFullNovelData(data) {
      // 验证必要字段
      if (!data.parameters || !data.history) {
        throw new Error('文件格式不正确，缺少必要字段');
      }
      
      // 恢复参数
      if (confirm('是否恢复保存的配置参数？')) {
        this.model = data.parameters.model || 'deepseek-reasoner';
        this.enableReasoning = data.parameters.enableReasoning !== undefined ? data.parameters.enableReasoning : true;
        this.reasoningDisplay = data.parameters.reasoningDisplay || 'separate';
        this.worldView = data.parameters.worldView || '';
        this.perspective = data.parameters.perspective || '第三人称';
        this.additionalInfo = data.parameters.additionalInfo || '';
        this.chapterNumber = data.parameters.chapterNumber || 1;
        this.chapterName = data.parameters.chapterName || '';
        this.characters = data.parameters.characters && data.parameters.characters.length > 0 
          ? data.parameters.characters 
          : [{ name: '', setting: '' }];
        this.plotRequirement = data.parameters.plotRequirement || '';
        
        // 保存参数到本地存储
        this.saveAllParameters();
      }
      
      // 恢复历史记录
      if (confirm(`是否导入 ${data.history.length} 个章节到历史记录？`)) {
        this.history = data.history.map(item => ({
          ...item,
          // 确保必要字段存在
          isEdited: item.isEdited || false,
          imported: true,
          reasoningContent: item.reasoningContent || '',
          timestamp: item.timestamp || new Date().toISOString()
        }));
        
        // 保存历史记录
        this.saveHistory();
        
        alert(`成功导入 ${this.history.length} 个章节！`);
        
        // 如果有历史记录，默认选中第一个
        if (this.history.length > 0) {
          this.selectHistoryItem(0);
        }
      }
    },
    
    // 导入旧版格式
    importLegacyFormat(data) {
      if (data.parameters) {
        // 导入参数
        this.model = data.parameters.model || 'deepseek-reasoner';
        this.enableReasoning = data.parameters.enableReasoning !== undefined ? data.parameters.enableReasoning : true;
        this.reasoningDisplay = data.parameters.reasoningDisplay || 'separate';
        this.worldView = data.parameters.worldView || '';
        this.perspective = data.parameters.perspective || '第三人称';
        this.additionalInfo = data.parameters.additionalInfo || '';
        this.chapterNumber = data.parameters.chapterNumber || 1;
        this.chapterName = data.parameters.chapterName || '';
        this.characters = data.parameters.characters && data.parameters.characters.length > 0 
          ? data.parameters.characters 
          : [{ name: '', setting: '' }];
        this.plotRequirement = data.parameters.plotRequirement || '';
        
        this.saveAllParameters();
        alert('配置参数已恢复！');
      }
    },
    
    // 导入为单个章节
    importAsSingleChapter(content, filename) {
      // 从文件名提取章节信息
      const chapterMatch = filename.match(/(第\d+章)?(.*)\.(json|txt)/i);
      const chapterTitle = chapterMatch 
        ? (chapterMatch[1] || '') + (chapterMatch[2] || '导入章节')
        : '导入章节';
      
      // 创建新的历史记录项
      const newHistoryItem = {
        chapterTitle: chapterTitle,
        content: content,
        characterCount: content.length,
        chineseCount: countChineseCharacters(content),
        timestamp: new Date().toISOString(),
        isEdited: false,
        imported: true,
        reasoningContent: '', // 纯文本导入没有思维链
        config: {
          worldView: this.worldView,
          perspective: this.perspective,
          characters: this.characters,
          plotRequirement: this.plotRequirement,
          model: this.model,
          enableReasoning: this.enableReasoning
        }
      };
      
      // 添加到历史记录
      this.history.push(newHistoryItem);
      this.saveHistory();
      
      // 自动选中新导入的章节
      this.selectHistoryItem(this.history.length - 1);
      
      alert(`已导入章节: ${chapterTitle}`);
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
        // 兼容旧数据：添加必要字段
        this.history = history.map(item => ({
          ...item,
          isEdited: item.isEdited || false,
          imported: item.imported || false,
          reasoningContent: item.reasoningContent || '' // 新增思维链字段
        }));
      }
    }
  }
};
</script>

<style scoped>
/* 基础布局样式优化 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #f5f5f5;
  overflow: hidden;
  height: 100vh;
  box-sizing: border-box;
}

.header {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2c3e50, #4a6572);
  color: white;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  flex-shrink: 0;
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
  overflow: hidden;
  min-height: 0;
}

/* 模块样式优化 */
.module {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.module h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 12px;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 12px;
  flex-shrink: 0;
  position: relative; /* 为悬浮提示定位 */
}

.module-header h2 {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.module-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 5px;
}

/* 隐藏滚动条但保留滚动功能 */
.module-content::-webkit-scrollbar {
  width: 6px;
}

.module-content::-webkit-scrollbar-track {
  background: transparent;
}

.module-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.3s;
}

.module-content:hover::-webkit-scrollbar-thumb {
  opacity: 1;
}

/* Firefox 隐藏滚动条 */
.module-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

/* 悬浮生成状态指示器 */
.floating-generating-indicator {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 100;
  min-width: 350px;
  max-width: 400px;
}

.generating-progress {
  background: white;
  margin-top: 10px;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 15px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.progress-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-text {
  flex: 1;
}

.generating-title {
  margin: 0 0 5px 0;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.generating-stats {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #3498db;
}

/* 历史记录列表样式优化 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 5px;
  overflow-y: auto;
  max-height: none;
}

.history-item {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e1e8ed;
  overflow: visible;
  position: relative;
  flex-shrink: 0;
}

/* 移除历史项的横向滚动效果 */
.history-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.history-item.active {
  border-left-color: #e74c3c;
  background: #e3f2fd;
  border-color: #3498db;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  overflow: visible;
}

.history-item-header h4 {
  margin: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-badges {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.preview-text {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.meta-info {
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 12px;
  overflow: visible;
}

.history-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  overflow: visible;
}

/* 预览内容区域优化 */
.preview-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-display {
  flex: 1;
  margin-bottom: 20px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.content-view, .reasoning-view, .combined-view {
  flex: 1;
  min-height: 200px;
  max-height: 100%;
  overflow-y: auto;
  background: white;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #eaeaea;
  position: relative;
}

/* 隐藏内容区域的滚动条 */
.content-view::-webkit-scrollbar,
.reasoning-view::-webkit-scrollbar,
.combined-view::-webkit-scrollbar {
  width: 4px;
}

.content-view::-webkit-scrollbar-track,
.reasoning-view::-webkit-scrollbar-track,
.combined-view::-webkit-scrollbar-track {
  background: transparent;
}

.content-view::-webkit-scrollbar-thumb,
.reasoning-view::-webkit-scrollbar-thumb,
.combined-view::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

/* 配置区域优化 */
.config-section {
  margin-bottom: 25px;
  padding: 18px;
  border-radius: 8px;
  background: #f8fafc;
  border-left: 4px solid #3498db;
  overflow: visible;
}

.parameter-settings .module-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 内容选项卡样式优化 */
.content-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
  border-bottom: 2px solid #eaeaea;
  padding-bottom: 10px;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.content-tabs::-webkit-scrollbar {
  height: 3px;
}

.content-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.content-tabs::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 1.5px;
}

.tab-button {
  padding: 8px 16px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  transition: all 0.3s;
  position: relative;
  border-bottom: 2px solid transparent;
  margin-bottom: -12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-button:hover:not(.disabled) {
  background: #e9ecef;
  color: #333;
}

.tab-button.active {
  background: white;
  color: #3498db;
  border-bottom: 2px solid #3498db;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.05);
}

.tab-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-badge {
  background: #e74c3c;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  margin-left: 5px;
}

/* 新增样式 */
.get-key-btn {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.get-key-btn:hover {
  background: linear-gradient(135deg, #8e44ad, #7d3c98);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(155, 89, 182, 0.3);
}

.parameter-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* 复选框样式 */
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label {
  cursor: pointer;
  user-select: none;
  font-size: 14px;
}

.disabled-hint {
  color: #7f8c8d;
  font-size: 12px;
  font-style: italic;
}

/* 内容视图样式 */
.content-view, .reasoning-view, .combined-view {
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  background: white;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #eaeaea;
}

.reasoning-view {
  background: #f8f9fa;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.reasoning-text {
  color: #2c3e50;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.streaming-reasoning {
  min-height: 200px;
}

/* 合并视图样式 */
.combined-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.combined-section {
  flex: 1;
}

.combined-section h4 {
  margin-bottom: 10px;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
  font-size: 16px;
}

.combined-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #3498db, transparent);
  margin: 10px 0;
}

/* 导入状态指示器 */
.importing-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.importing-indicator .spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

/* 历史记录中的思维链标记 */
.history-item.hasReasoning {
  border-left-color: #9b59b6;
}

.reasoning-badge {
  background: #9b59b6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

/* 流式显示的特殊样式 */
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
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.content-textarea {
  width: 90%;
  min-height: 400px;
  margin: 10px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: 'Georgia', serif;
  font-size: 15px;
  line-height: 1.8;
  resize: vertical;
  background: white;
  overflow-y: auto;
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
  position: relative;
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

/* 其他原有样式 */
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
  box-sizing: border-box;
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

.textarea-field.auto-resize {
  resize: none;
  overflow-y: hidden;
  min-height: 60px;
  line-height: 1.5;
  transition: height 0.2s ease;
}

.textarea-field.small.auto-resize {
  min-height: 60px;
  max-height: 200px;
}

.content-textarea.auto-resize {
  min-height: 400px;
  max-height: 800px;
}

/* 自定义滚动条样式 */
.textarea-field.auto-resize::-webkit-scrollbar,
.content-textarea.auto-resize::-webkit-scrollbar {
  width: 6px;
}

.textarea-field.auto-resize::-webkit-scrollbar-track,
.content-textarea.auto-resize::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.textarea-field.auto-resize::-webkit-scrollbar-thumb,
.content-textarea.auto-resize::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.textarea-field.auto-resize::-webkit-scrollbar-thumb:hover,
.content-textarea.auto-resize::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.input-field.small, .textarea-field.small {
  font-size: 13px;
  margin-bottom: 15px;
}

.input-field.small {
  width: 50%;
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
.character-juese {
  background: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #e1e8ed;
  display: grid;
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
  margin: 0px;
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

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.stats {
  color: #7f8c8d;
  font-size: 14px;
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
  
  .parameter-settings .module-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .parameter-settings .config-section {
    margin-bottom: 0;
    display: flex;
    flex-direction: column;
  }
}

@media (min-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr 2fr 1fr;
  }
  
  .parameter-settings {
    grid-column: auto;
  }
  
  .parameter-settings .module-content {
    display: flex;
    flex-direction: column;
    grid-template-columns: none;
  }
}

@media (max-width: 767px) {
  .main-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .module {
    min-height: 300px;
  }
  
  .history-list {
    max-height: 400px;
  }
  
  .floating-generating-indicator {
    position: fixed;
    top: auto;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    min-width: 90%;
    max-width: 90%;
  }
  
  .input-row {
    grid-template-columns: 1fr;
  }
  
  .character-juese {
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
  
  .parameter-actions {
    flex-direction: column;
  }
  
  .content-tabs {
    flex-wrap: wrap;
  }
  
  .tab-button {
    flex: 1;
    min-width: 80px;
    text-align: center;
  }
  
  .combined-content {
    flex-direction: column;
  }
}

/* Firefox隐藏滚动条的额外处理 */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

/* 确保所有滚动区域都有统一的行为 */
.scrollable-area {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollable-area::-webkit-scrollbar {
  display: none;
}

/* 确保内容文本可读且滚动 */
.content-text, .reasoning-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.8;
  font-family: 'Georgia', serif;
  height: 100%;
  overflow-y: auto;
  padding-right: 5px;
}

/* 导入状态指示器样式 */
.importing-indicator .spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.importing-indicator p {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 500;
}

/* 修复输入组样式 */
.input-group {
  margin-bottom: 20px;
}

.input-group:last-child {
  margin-bottom: 0;
}
</style>