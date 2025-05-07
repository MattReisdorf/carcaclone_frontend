import {
  uniqueNamesGenerator,
  names,
  NumberDictionary,
} from "unique-names-generator";


const generateUniqueName = () => {
  const uniqueName: string = uniqueNamesGenerator({
    dictionaries: [names, NumberDictionary.generate({ min: 100, max: 999 })],
      length: 2,
      separator: "",
      style: "capital",
  });
  return uniqueName;
}

export { generateUniqueName };