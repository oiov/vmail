import { useEffect, useRef, ReactNode, Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import clsx from "clsx";

export default function Leaflet({
  setShow,
  showBlur,
  children,
  theme = 'light', // 新增：添加 theme 属性，默认为 'light'
}: {
  setShow: Dispatch<SetStateAction<boolean>>;
  showBlur: boolean;
  children: ReactNode;
  theme?: 'light' | 'dark'; // 新增：定义 theme 属性类型
}) {
  const leafletRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const transitionProps = { type: "spring", stiffness: 500, damping: 30 };
  useEffect(() => {
    controls.start({
      y: 20,
      transition: transitionProps,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDragEnd(_: any, info: any) {
    const offset = info.offset.y;
    const velocity = info.velocity.y;
    const height = leafletRef.current?.getBoundingClientRect().height || 0;
    if (offset > height / 2 || velocity > 800) {
      await controls.start({ y: "100%", transition: transitionProps });
      setShow(false);
    } else {
      controls.start({ y: 0, transition: transitionProps });
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={leafletRef}
        key="leaflet"
        // 修复：使用 clsx 根据 theme 动态设置背景色
        className={clsx(
            "group fixed inset-x-0 bottom-0 z-40 w-screen cursor-grab overflow-y-scroll pb-5 active:cursor-grabbing sm:hidden",
            theme === 'light' ? 'bg-white' : 'bg-neutral-800/95'
        )}
        style={{ maxHeight: "95%" }}
        initial={{ y: "100%" }}
        animate={controls}
        exit={{ y: "100%" }}
        transition={transitionProps}
        drag="y"
        dragDirectionLock
        onDragEnd={handleDragEnd}
        dragElastic={{ top: 0, bottom: 1 }}
        dragConstraints={{ top: 0, bottom: 0 }}>
        <div
            // 修复：根据 theme 动态设置顶部边框颜色
            className={clsx(
                "rounded-t-4xl -mb-1 flex h-7 w-full items-center justify-center border-t",
                theme === 'light' ? 'border-gray-200' : 'border-cyan-50/20'
            )}
        >
          <div className="-mr-1 h-1 w-6 rounded-full bg-gray-300 transition-all group-active:rotate-12" />
          <div className="h-1 w-6 rounded-full bg-gray-300 transition-all group-active:-rotate-12" />
        </div>
        {children}
      </motion.div>
      {showBlur && (
        <motion.div
          key="leaflet-backdrop"
          className="fixed inset-0 z-30 bg-gray-100 bg-opacity-10 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShow(false)}
        />
      )}
    </AnimatePresence>
  );
}
