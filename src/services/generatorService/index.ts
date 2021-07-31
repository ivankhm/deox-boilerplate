import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

import * as ejs from 'ejs';


const capitalizeFirstLetter = (string: string) => 
 string.charAt(0).toUpperCase() + string.slice(1);
;

const getStoreInterface = (rootNode: ts.SourceFile, storeInterfaceName: string) => {
  return rootNode.forEachChild(child => {
    if (child.kind === ts.SyntaxKind.InterfaceDeclaration) {

      const childInterface = child as ts.InterfaceDeclaration;

      if (childInterface.name.escapedText.toString() === storeInterfaceName) {
        return childInterface;
      }
    }
   });
};

const getStoreActionsEnum = (rootNode: ts.SourceFile, storeActionEnumName: string) => {
  return rootNode.forEachChild(child => {
    if (child.kind === ts.SyntaxKind.EnumDeclaration) {
      const childEnum = child as ts.EnumDeclaration;

      if (childEnum.name.escapedText.toString() === storeActionEnumName) {
        return childEnum;
      }
    }
   });
};

const getStoreName =  (filePath: string) => {
  const pathParts = path.dirname(filePath).split(path.sep);
  return pathParts[pathParts.length - 1];
};

const getName = (field: ts.NamedDeclaration) => (field.name as ts.Identifier).escapedText.toString();

const getInterfaceName = (storeName: string) => `${capitalizeFirstLetter(storeName)}State`;
const getActionsEnumName = (storeName: string) => `${capitalizeFirstLetter(storeName)}ActionTypes`;

const kindToInitialValueMap: Map<ts.SyntaxKind, Function> = new Map<ts.SyntaxKind, Function>([
  [ts.SyntaxKind.TypeLiteral, (type: ts.ObjectTypeDeclaration) => Object.fromEntries(type!.members.map(getInitialValues))],
  [ts.SyntaxKind.BooleanKeyword, () => false],
  [ts.SyntaxKind.ArrayType, () => []],
  [ts.SyntaxKind.UnionType, () => null],
]);

const getInitialValues = (field: ts.NamedDeclaration): [string, any] => {
  
  const fieldPropertySignature = field as ts.PropertySignature;

  const name = getName(fieldPropertySignature);
  
  const fieldKind = fieldPropertySignature.type?.kind!;
  console.log(`${name} - ${ts.SyntaxKind[fieldKind]}`);
  
  return [name, kindToInitialValueMap.get(fieldKind)?.(fieldPropertySignature.type)];
};

export const generateDeoxFiles = async  (filePath: string) => {
  const storeName = getStoreName(filePath);
  const storeInterfaceName = getInterfaceName(storeName);
  const storeActionsEnumName = getActionsEnumName(storeName);

  const declarations = fs.readFileSync(filePath).toString();
  const rootNode = ts.createSourceFile('types.ts', declarations, ts.ScriptTarget.Latest);

  const storeInterface = getStoreInterface(rootNode, storeInterfaceName);
  const storeActionEnum = getStoreActionsEnum(rootNode, storeActionsEnumName);

  if (!storeInterface) {
    throw new Error(`Interface ${storeInterfaceName} was not found in ${filePath}.`);
  }

  if (!storeActionEnum) {
    throw new Error(`Enum ${storeActionEnum} was not found in ${filePath}.`);
  }

  const fieldNames = storeInterface.members.map(field => getName(field));
  
  const rawTemplate = fs.readFileSync(path.join(__dirname, './templates/selectors.template.ts.ejs')).toString();
  const selectorsTemplate = ejs.compile(rawTemplate);

  const stateSelectorName = `get${storeInterfaceName}`;
  const ejsData = {
    storeName,
    storeInterfaceName,
    types: [storeInterfaceName, 'News', 'NewsCategory'],
    stateSelectorName,
    selectors: fieldNames.map(fieldName => ({
      name: `get${capitalizeFirstLetter(fieldName)}`,
      returnType: 'any',
      fieldPath: fieldName,
    })),
  };

  console.log(ejsData);
  
  
  const result = selectorsTemplate(ejsData);

  fs.writeFileSync(path.join(path.dirname(filePath), 'selectors.ts'), result);

  console.log(result);
  
};