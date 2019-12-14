/**
 * Merge items. Assumes an id and dateTime prop on the items.
 *
 * @param {Array<>} itemArray1
 * @param {Array<>} itemArray2
 * @return {Array<>}
 */
const mergeItems = (itemArray1, itemArray2) => {
  // Use a map for performance
  const itemMap = new Map();

  const addUniqueOnly = item => {
    if (!item.id) return;

    if (!itemMap.get(item.id)) itemMap.set(item.id, item);
  };

  itemArray1.forEach(addUniqueOnly);
  itemArray2.forEach(addUniqueOnly);

  // Now turn the map into an array and sort it
  return Array.from(itemMap, entry => entry[1]).sort((a, b) => {
    if (a.dateTime < b.dateTime) return -1;
    if (a.dateTime > b.dateTime) return 1;

    return 0;
  });
};

export default mergeItems;
