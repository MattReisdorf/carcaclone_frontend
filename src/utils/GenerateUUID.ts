// Generate Player's UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (character) {
      const rand = (Math.random() * 16) | 0,
        value = character === "x" ? rand : (rand & 0x3) | 0x8;
      return value.toString(16);
    },
  );
};

export { generateUUID };