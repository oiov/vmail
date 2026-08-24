// worker/src/api/v1/localPart.ts
// 深模块(叶): v1 创建邮箱的 localPart 唯一格式闸口
// Interface: LOCAL_PART_PATTERN · isValidLocalPart
// Implementation: 纯正则, 零依赖——node --test 可直接加载(路由模块链含无后缀导入不可加载)

/** 2-32 位, 首尾必须字母数字, 中间允许 . _ - */
export const LOCAL_PART_PATTERN =
  /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,30}[a-zA-Z0-9]$/;

export function isValidLocalPart(value: string): boolean {
  return LOCAL_PART_PATTERN.test(value);
}
