import OpenAI from "openai";

// 统计中文字符数量
export function countChineseCharacters(str) {
    if (!str) return 0;
    const regex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u20000-\u2A6DF]/gu;
    const matches = str.match(regex);
    return matches ? matches.length : 0;
}

// 创建OpenAI客户端实例
function createOpenAIClient(apiKey) {
    return new OpenAI({
        baseURL: 'https://api.deepseek.com/v3.2_speciale_expires_on_20251215',
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });
}

// 构建系统配置
export function buildSystemConfig(worldView, perspective, additionalInfo) {
    const config = {
        "设定": "你是一个专业的小说创作助手，请根据用户要求生成高质量的小说章节内容。",
        "世界观设定": worldView,
        "人称视角": perspective,
        "写作要求": {
            "语言风格": "生动形象，富有文学性",
            "描写重点": "注重环境氛围、人物心理、动作细节",
            "章节结构": "完整的起承转合",
            "字数控制": "3000-4000字为宜"
        },
        "重要规则": "请直接开始章节内容，不要添加任何开场白、说明或总结性文字。章节结尾要自然收束，不要跳出故事进行评论。"
    };

    if (additionalInfo && additionalInfo.trim()) {
        config["补充信息"] = additionalInfo;
    }

    return config;
}

// 构建用户配置
export function buildUserConfig(chapterNumber, chapterName, plotRequirement, characters, history = "") {
    const config = {
        "章节信息": `第${chapterNumber}章${chapterName ? `：${chapterName}` : ''}`,
        "情节要求": plotRequirement || "请根据世界观设定自然发展情节"
    };

    // 添加角色信息
    const validCharacters = characters.filter(char => char.name && char.setting);
    if (validCharacters.length > 0) {
        config["登场角色"] = validCharacters;
    }

    // 添加上下文信息
    if (history && history.trim()) {
        config["历史上下文"] = history;
    }

    return config;
}

// 构建完整的提示词
function buildMessages(systemConfig, userConfig) {
    const systemMessage = {
        role: "system",
        content: `你是一个专业的小说创作助手。请严格按照以下要求生成内容：

世界观：${systemConfig.世界观设定}
人称视角：${systemConfig.人称视角}
写作风格：${JSON.stringify(systemConfig.写作要求)}
特殊要求：${systemConfig.重要规则}

请直接输出小说章节内容，不要添加任何额外的说明、开场白或总结。`
    };

    const userMessageContent = [
        `请生成：${userConfig.章节信息}`,
        `情节要求：${userConfig.情节要求}`
    ];

    if (userConfig.登场角色 && userConfig.登场角色.length > 0) {
        userMessageContent.push(`登场角色：${JSON.stringify(userConfig.登场角色)}`);
    }

    if (userConfig.历史上下文) {
        userMessageContent.push(`历史上下文：${userConfig.历史上下文}`);
    }

    const userMessage = {
        role: "user",
        content: userMessageContent.join('\n')
    };

    return [systemMessage, userMessage];
}

// 主功能函数 - 生成内容
export async function generateContent(params) {
    try {
        const {
            apiKey,
            systemConfig = {},
            userConfig = {},
            model = "deepseek-reasoner", // 默认使用deepseek-reasoner模型
            maxTokens = 64000,
            temperature = 0.7,
            enableReasoning = true // 新增：是否启用思维链
        } = params;

        // 验证必要参数
        if (!apiKey) {
            throw new Error("API密钥不能为空");
        }

        // 创建OpenAI客户端
        const openai = createOpenAIClient(apiKey);

        // 构建消息
        const messages = buildMessages(systemConfig, userConfig);

        console.log("发送请求到DeepSeek API...");
        console.log("系统消息:", messages[0].content);
        console.log("用户消息:", messages[1].content);
        console.log("启用思维链:", enableReasoning);
        console.log("使用模型:", model);

        // 根据是否启用思维链设置请求参数
        const requestConfig = {
            messages: messages,
            model: model,
            max_tokens: maxTokens,
            stream: true,
        };

        // 如果启用了思维链，添加thinking参数
        if (enableReasoning && model === "deepseek-reasoner") {
            requestConfig.extra_body = {
                thinking: { type: "enabled" }
            };
            console.log("已启用思维链模式");
        } else if (enableReasoning && model !== "deepseek-reasoner") {
            console.warn("只有deepseek-reasoner模型支持思维链，已禁用思维链");
        } else {
            // 如果没有启用思维链，添加temperature参数
            requestConfig.temperature = temperature;
        }

        const stream = await openai.chat.completions.create(requestConfig);

        console.log("API请求成功，开始流式传输...");
        return stream;
        
    } catch (error) {
        console.error("API调用失败:", error);
        
        let errorMessage = "生成失败: ";
        if (error.message.includes("401")) {
            errorMessage += "API密钥无效或已过期";
        } else if (error.message.includes("429")) {
            errorMessage += "请求频率过高，请稍后再试";
        } else if (error.message.includes("500")) {
            errorMessage += "服务器内部错误，请稍后再试";
        } else if (error.message.includes("network")) {
            errorMessage += "网络连接错误，请检查网络设置";
        } else if (error.message.includes("thinking")) {
            errorMessage += "思维链参数设置错误，请检查模型是否支持";
        } else {
            errorMessage += error.message;
        }
        
        throw new Error(errorMessage);
    }
}

// 处理流式响应 - 支持思维链的版本
export async function processStream(stream, onContentUpdate) {
    let fullContent = "";
    let reasoningContent = ""; // 新增：存储思维链内容
    let chineseCount = 0;
    let characterCount = 0;
    let startTime = Date.now();
    let lastUpdateTime = startTime;

    try {
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta || {};
            const content = delta.content || "";
            const reasoning = delta.reasoning_content || ""; // 获取思维链内容
            
            // 处理思维链内容
            if (reasoning) {
                reasoningContent += reasoning;
                
                // 传递思维链内容给回调函数
                if (onContentUpdate) {
                    onContentUpdate({
                        content: fullContent,
                        chineseCount: chineseCount,
                        characterCount: characterCount,
                        incrementalContent: content,
                        reasoningContent: reasoningContent,
                        incrementalReasoning: reasoning
                    });
                }
            }
            
            // 处理最终内容
            if (content) {
                fullContent += content;
                characterCount = fullContent.length;
                chineseCount = countChineseCharacters(fullContent);
                
                const currentTime = Date.now();
                
                // 实时回调更新内容
                if (onContentUpdate) {
                    onContentUpdate({
                        content: fullContent,
                        chineseCount: chineseCount,
                        characterCount: characterCount,
                        incrementalContent: content,
                        reasoningContent: reasoningContent,
                        incrementalReasoning: reasoning || ""
                    });
                }
                
                lastUpdateTime = currentTime;
            }
            
            // 检查是否完成
            if (chunk.choices[0]?.finish_reason) {
                const endTime = Date.now();
                const duration = (endTime - startTime) / 1000;
                console.log(`生成完成, 原因: ${chunk.choices[0].finish_reason}`);
                console.log(`总耗时: ${duration.toFixed(2)}秒`);
                console.log(`总字符数: ${characterCount}, 中文字符: ${chineseCount}`);
                console.log(`思维链长度: ${reasoningContent.length}字符`);
                break;
            }
        }

        // 最终后处理
        const processedContent = postProcessContent(fullContent);
        
        return {
            finalContent: processedContent,
            reasoningContent: reasoningContent,
            chineseCount: countChineseCharacters(processedContent),
            characterCount: processedContent.length,
            success: true,
            duration: (Date.now() - startTime) / 1000
        };
        
    } catch (error) {
        console.error("流处理错误:", error);
        return {
            finalContent: fullContent,
            reasoningContent: reasoningContent,
            chineseCount: chineseCount,
            characterCount: characterCount,
            success: false,
            error: error.message
        };
    }
}

// 处理非流式响应 - 支持思维链的版本
export async function processNonStreamResponse(stream, onContentUpdate) {
    try {
        let fullResponse = "";
        
        for await (const chunk of stream) {
            fullResponse += JSON.stringify(chunk) + "\n";
        }
        
        // 解析完整的响应
        const lines = fullResponse.split("\n").filter(line => line.trim());
        let response = null;
        
        for (let i = lines.length - 1; i >= 0; i--) {
            try {
                response = JSON.parse(lines[i]);
                break;
            } catch (e) {
                continue;
            }
        }
        
        if (!response) {
            throw new Error("无法解析API响应");
        }
        
        // 获取思维链内容和最终内容
        const reasoningContent = response.choices?.[0]?.message?.reasoning_content || "";
        const finalContent = response.choices?.[0]?.message?.content || "";
        
        // 处理最终内容
        const processedContent = postProcessContent(finalContent);
        const chineseCount = countChineseCharacters(processedContent);
        
        if (onContentUpdate) {
            onContentUpdate({
                content: processedContent,
                reasoningContent: reasoningContent,
                chineseCount: chineseCount,
                characterCount: processedContent.length,
                isComplete: true
            });
        }
        
        return {
            finalContent: processedContent,
            reasoningContent: reasoningContent,
            chineseCount: chineseCount,
            characterCount: processedContent.length,
            success: true
        };
        
    } catch (error) {
        console.error("处理非流式响应错误:", error);
        return {
            finalContent: "",
            reasoningContent: "",
            chineseCount: 0,
            characterCount: 0,
            success: false,
            error: error.message
        };
    }
}

// 内容后处理
function postProcessContent(content) {
    if (!content) return "";
    
    let processed = content.trim();
    
    // 清理常见的AI附加文本
    const unwantedSuffixes = [
        "\n\n以上就是本章的内容。",
        "\n\n本章到此结束。",
        "\n\n希望这个章节符合您的要求。",
        "\n\n如果您需要修改或继续生成，请告诉我。",
        "\n\n请问您对本章内容是否满意？",
        "\n\n以上就是根据您的要求生成的小说章节内容。",
        "\n\n以上就是为您生成的小说章节。",
        "\n\n内容生成完毕。",
        "\n\n生成完成。"
    ];
    
    unwantedSuffixes.forEach(suffix => {
        if (processed.endsWith(suffix)) {
            processed = processed.slice(0, -suffix.length);
        }
    });
    
    // 清理多余的换行
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    return processed;
}

// 思维链内容后处理
export function postProcessReasoning(content) {
    if (!content) return "";
    
    let processed = content.trim();
    
    // 清理思维链中的多余标记
    const reasoningMarkers = [
        "思考过程：",
        "思考：",
        "推理：",
        "分析：",
        "让我们一步步思考：",
        "首先，",
        "接下来，",
        "最后，"
    ];
    
    // 只保留实际的思考内容
    reasoningMarkers.forEach(marker => {
        if (processed.startsWith(marker)) {
            processed = processed.slice(marker.length).trim();
        }
    });
    
    // 清理多余的换行
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    return processed;
}

// 验证配置
export function validateConfig(apiKey, worldView, perspective, chapterNumber) {
    const errors = [];

    if (!apiKey || apiKey.trim().length === 0) {
        errors.push("API密钥不能为空");
    }

    if (!worldView || worldView.trim().length === 0) {
        errors.push("世界观设定不能为空");
    }

    if (!perspective || perspective.trim().length === 0) {
        errors.push("人称视角不能为空");
    }

    if (!chapterNumber || chapterNumber < 1) {
        errors.push("章节号必须大于0");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// 新增：格式化和显示思维链内容的工具函数
export function formatReasoningContent(reasoningContent, includeMarkdown = true) {
    if (!reasoningContent) return "";
    
    let formatted = reasoningContent;
    
    // 如果启用Markdown格式，添加代码块
    if (includeMarkdown) {
        formatted = `## 模型思考过程\n\n\`\`\`\n${reasoningContent}\n\`\`\``;
    }
    
    return formatted;
}

// 新增：合并思维链和最终内容的函数
export function combineReasoningAndContent(reasoningContent, finalContent, options = {}) {
    const {
        showReasoning = true,
        reasoningTitle = "模型思考过程",
        contentTitle = "生成内容",
        separator = "\n\n---\n\n"
    } = options;
    
    if (!showReasoning || !reasoningContent) {
        return finalContent;
    }
    
    return `## ${reasoningTitle}\n\n${reasoningContent}${separator}## ${contentTitle}\n\n${finalContent}`;
}

// 新增：生成章节标题
export function generateChapterTitle(chapterNumber, chapterName = "") {
    return `第${chapterNumber}章${chapterName ? `：${chapterName}` : ''}`;
}

// 新增：获取文本统计信息
export function getTextStatistics(text) {
    if (!text) {
        return {
            characterCount: 0,
            chineseCount: 0,
            lineCount: 0,
            wordCount: 0
        };
    }
    
    const characterCount = text.length;
    const chineseCount = countChineseCharacters(text);
    const lineCount = text.split('\n').length;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
        characterCount,
        chineseCount,
        lineCount,
        wordCount
    };
}

// 新增：创建章节数据结构
export function createChapterData(chapterTitle, content, reasoningContent = "", config = {}) {
    const stats = getTextStatistics(content);
    
    return {
        chapterTitle,
        content,
        reasoningContent,
        characterCount: stats.characterCount,
        chineseCount: stats.chineseCount,
        lineCount: stats.lineCount,
        wordCount: stats.wordCount,
        timestamp: new Date().toISOString(),
        isEdited: false,
        imported: false,
        config: {
            model: config.model || "deepseek-reasoner",
            enableReasoning: config.enableReasoning || false,
            worldView: config.worldView || "",
            perspective: config.perspective || "",
            characters: config.characters || [],
            plotRequirement: config.plotRequirement || ""
        }
    };
}

// 新增：导出章节为多种格式
export function exportChapter(chapterData, format = 'txt') {
    if (!chapterData) return null;
    
    let content = '';
    let filename = `${chapterData.chapterTitle}`;
    
    switch (format.toLowerCase()) {
        case 'json':
            content = JSON.stringify(chapterData, null, 2);
            filename += '.json';
            break;
            
        case 'txt':
            content = chapterData.content;
            filename += '.txt';
            break;
            
        case 'md':
            if (chapterData.reasoningContent) {
                content = combineReasoningAndContent(
                    chapterData.reasoningContent,
                    chapterData.content,
                    {
                        showReasoning: true,
                        reasoningTitle: "模型思考过程",
                        contentTitle: chapterData.chapterTitle,
                        separator: "\n\n---\n\n"
                    }
                );
            } else {
                content = `# ${chapterData.chapterTitle}\n\n${chapterData.content}`;
            }
            filename += '.md';
            break;
            
        case 'reasoning':
            content = chapterData.reasoningContent || '';
            filename += '_思维链.txt';
            break;
            
        default:
            content = chapterData.content;
            filename += '.txt';
    }
    
    return {
        content,
        filename,
        format
    };
}

// 新增：批量导出多个章节
export function exportMultipleChapters(chapters, format = 'txt', includeReasoning = false) {
    if (!chapters || chapters.length === 0) return null;
    
    let content = '';
    let filename = `小说全本_${chapters.length}章`;
    
    switch (format.toLowerCase()) {
        case 'json':
            const exportData = {
                format: 'novel-full-export',
                version: '1.1',
                exportedAt: new Date().toISOString(),
                generator: 'TaleMaker DS便捷小说生成器',
                chapters: chapters.map(chapter => ({
                    ...chapter,
                    // 清理大对象，只保留必要数据
                    config: chapter.config || {}
                })),
                statistics: {
                    totalChapters: chapters.length,
                    totalCharacters: chapters.reduce((sum, ch) => sum + ch.characterCount, 0),
                    totalChineseCharacters: chapters.reduce((sum, ch) => sum + ch.chineseCount, 0),
                    chaptersWithReasoning: chapters.filter(ch => ch.reasoningContent).length
                }
            };
            content = JSON.stringify(exportData, null, 2);
            filename += '.json';
            break;
            
        case 'txt':
            content = chapters.map(chapter => {
                let chapterContent = `${chapter.chapterTitle}\n\n${chapter.content}`;
                
                if (includeReasoning && chapter.reasoningContent) {
                    chapterContent = `【模型思考过程】\n${chapter.reasoningContent}\n\n【生成内容】\n${chapter.content}`;
                }
                
                return chapterContent + '\n\n' + '='.repeat(50) + '\n\n';
            }).join('\n');
            
            // 添加统计信息
            const totalChars = chapters.reduce((sum, ch) => sum + ch.characterCount, 0);
            const totalChinese = chapters.reduce((sum, ch) => sum + ch.chineseCount, 0);
            
            content += `\n统计信息：\n`;
            content += `总章节数: ${chapters.length}\n`;
            content += `总字符数: ${totalChars}\n`;
            content += `总中文字符数: ${totalChinese}\n`;
            
            filename += '.txt';
            break;
            
        case 'md':
            content = '# 小说全本\n\n';
            content += `生成时间: ${new Date().toLocaleString()}\n`;
            content += `总章节数: ${chapters.length}\n\n`;
            
            chapters.forEach((chapter, index) => {
                content += `## ${chapter.chapterTitle}\n\n`;
                
                if (includeReasoning && chapter.reasoningContent) {
                    content += `### 模型思考过程\n\n\`\`\`\n${chapter.reasoningContent}\n\`\`\`\n\n`;
                    content += `### 生成内容\n\n`;
                }
                
                content += `${chapter.content}\n\n`;
                
                if (index < chapters.length - 1) {
                    content += '---\n\n';
                }
            });
            
            filename += '.md';
            break;
            
        default:
            content = chapters.map(chapter => 
                `${chapter.chapterTitle}\n\n${chapter.content}\n\n`
            ).join('\n');
            filename += '.txt';
    }
    
    return {
        content,
        filename,
        format,
        chapterCount: chapters.length
    };
}

// 新增：导入章节数据
export function importChapters(importData) {
    try {
        // 尝试解析为JSON
        const data = JSON.parse(importData);
        
        // 检查是否是全本导出格式
        if (data.format === 'novel-full-export') {
            return {
                type: 'full-export',
                data: data,
                chapters: data.chapters || [],
                parameters: data.parameters || null,
                statistics: data.statistics || null
            };
        }
        
        // 检查是否是单个章节
        if (data.chapterTitle && data.content) {
            return {
                type: 'single-chapter',
                chapters: [data]
            };
        }
        
        // 其他格式的JSON数据
        return {
            type: 'unknown-json',
            data: data
        };
        
    } catch (error) {
        // 如果不是JSON，作为纯文本处理
        return {
            type: 'plain-text',
            content: importData
        };
    }
}

// 新增：生成模型配置说明
export function generateModelConfigHelp() {
    return {
        models: [
            {
                id: 'deepseek-reasoner',
                name: 'DeepSeek Reasoner',
                description: '支持思维链推理的模型，能展示模型的思考过程',
                supportsReasoning: true,
                maxTokens: 64000
            },
            {
                id: 'deepseek-chat',
                name: 'DeepSeek Chat',
                description: '常规聊天模型，响应速度快',
                supportsReasoning: false,
                maxTokens: 32000
            }
        ],
        reasoning: {
            enabled: '开启思维链，模型会先输出思考过程再生成最终答案',
            disabled: '关闭思维链，直接生成最终答案',
            note: '只有DeepSeek Reasoner模型支持思维链功能'
        }
    };
}

export default {
    generateContent,
    processStream,
    processNonStreamResponse,
    buildSystemConfig,
    buildUserConfig,
    countChineseCharacters,
    validateConfig,
    formatReasoningContent,
    combineReasoningAndContent,
    postProcessReasoning,
    generateChapterTitle,
    getTextStatistics,
    createChapterData,
    exportChapter,
    exportMultipleChapters,
    importChapters,
    generateModelConfigHelp
};