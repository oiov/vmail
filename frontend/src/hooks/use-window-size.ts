import { useEffect, useState } from "react";

/**
 * 一个自定义 React Hook，用于获取窗口的尺寸。
 * @returns {object} 包含窗口尺寸信息和设备类型判断的对象。
 */
export default function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined;
    height: number | undefined;
  }>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // 窗口尺寸变化时调用的处理函数
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // 添加窗口尺寸变化事件监听器
    window.addEventListener("resize", handleResize);

    // 立即调用一次以获取初始窗口尺寸
    handleResize();

    // 组件卸载时移除事件监听器
    return () => window.removeEventListener("resize", handleResize);
  }, []); // 空依赖数组确保此 effect 只在组件挂载和卸载时运行

  return {
    windowSize,
    // 判断是否为移动设备
    isMobile: typeof windowSize?.width === "number" && windowSize?.width < 768,
    // 判断是否为桌面设备
    isDesktop:
      typeof windowSize?.width === "number" && windowSize?.width >= 768,
  };
}
