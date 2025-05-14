// Whispers of the Mountain/src/theme/colors.js

const colors = {
  // ----- 核心调色板 (基于您的UI截图) -----
  background: '#E0F2F1',      // 整体应用背景 (匹配截图)
  primary: '#26A69A',         // 主要交互/高亮颜色 (匹配截图)
  accent: '#80CBC4',          // 次要或强调色，也用于某些卡片背景 (匹配截图)
  text: '#263339',            // 主要文本颜色 (匹配截图)

  // ----- 文本颜色变体 -----
  textSecondary: '#728f9e',   // 次要文本，如子标题、时间戳 (匹配截图 "text-200")
  textLight: '#FFFFFF',         // 用于深色背景上的文本
  textOnPrimary: '#FFFFFF',     // 用于 `primary` 背景色上的文本 (例如 "Total Balance" 卡片中的金额)
  textOnAccent: '#263339',      // 用于 `accent` 背景色上的文本 (例如 "Income" 卡片中的标题)

  // ----- 背景颜色变体 (基于您的UI截图左侧面板) -----
  bg200: '#D0EBEA',           // 较浅的背景变体，或用于区分区域 (匹配截图 "bg-200")
  bg300: '#FFFFFF',           // 通常用作卡片、模态框、输入框的背景 (匹配截图 "bg-300")

  // ----- 主要颜色变体 (基于您的UI截图左侧面板) -----
  primary200: '#408d86',      // 较暗或饱和度较低的主要色 (匹配截图 "primary-200")
  primary300: '#cdfaf6',      // 非常浅的主要色 (匹配截图 "primary-300")

  // ----- 强调颜色变体 (基于您的UI截图左侧面板) -----
  accent200: '#43A49B',       // 强调色的变体 (匹配截图 "accent-200")

  // ----- 导航相关 -----
  tabBarBackground: '#FFFFFF', // 标签栏背景，白色使其突出
  tabBarActiveTintColor: '#26A69A', // 活动标签使用主色
  tabBarInactiveTintColor: '#728f9e', // 非活动标签使用次要文本颜色

  headerBackground: '#E0F2F1', // 页眉背景与应用背景一致
  headerTintColor: '#263339',  // 页眉文本/图标颜色

  // ----- UI组件特定颜色 -----
  publishButtonBackground: '#26A69A', // 发布按钮背景用主色
  publishButtonIconColor: '#FFFFFF',  // 发布按钮图标用浅色文本

  cardBackground: '#FFFFFF',          // 通用卡片背景 (可以使用 bg300)
  cardShadow: 'rgba(0, 0, 0, 0.08)',  // 浅色模式下阴影可以更柔和
  borderColor: '#D0EBEA',            // 边框颜色 (可以使用 bg200 或更中性的灰色)
  inputBackground: '#FFFFFF',         // 输入框背景 (可以使用 bg300)
  placeholderText: '#A1A1AA',        // 输入框占位符颜色
  iconColor: '#263339',              // 通用图标颜色 (可以使用 text 或 primary)
  
  // ----- 语义化颜色 (根据需要添加) -----
  // 例如：图表线条 (已用 primary), 图表填充 (已用 accent)
  // 投资项目卡片 (APPL, TSLA, EBAY) 的背景可以是 accent 的浅色变体或 bg200
  investmentItemBackground: '#D0EBEA', //  (bg200) 或  '#E7F5F4' (accent的更浅变体)

  // ----- 状态栏 -----
  statusBarBackground: '#E0F2F1', // 与页眉/应用背景一致
  statusBarStyle: 'dark-content', // 浅色背景配深色状态栏文字/图标

  // ----- 基础颜色 (保持，以备不时之需) -----
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  tabInactive: '#8E8E93', // 非活动标签颜色 (可以使用 textSecondary)
  // ----- 针对截图中的特定元素 (如果需要更细致的控制) -----
  // 左侧边栏背景: accent ('#80CBC4')
  // "Total Balance" 卡片背景: primary ('#26A69A')
  // "Income", "Investments" 卡片背景: accent ('#80CBC4')
  // "View all" 按钮背景: primary ('#26A69A')
  // 导航图标颜色 (Wallet, Portfolio等): primary ('#26A69A')
  // "Log Out" 文本颜色: text ('#263339') 或 primary ('#26A69A') 强调其为可操作项

  // 示例：为截图中的特定卡片类型定义颜色
  cardPrimaryBackground: '#26A69A', // 对应 "Total Balance"
  cardAccentBackground: '#80CBC4',  // 对应 "Income", "Investments"
};

// 由于您现在不要暗色模式，我们只导出浅色模式的颜色
// 如果未来需要，可以将 lightColors 和 darkColors 分开定义并导出
// export { lightColors, darkColors };
// 现在直接导出 colors 对象
export default colors;