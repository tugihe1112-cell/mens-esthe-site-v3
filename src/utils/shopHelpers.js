export const getGroupKey = (shop) => {
  return shop?.group_id || shop?.id;
};
