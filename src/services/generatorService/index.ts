import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const capitalizeFirstLetter = (string: string) => 
 string.charAt(0).toUpperCase() + string.slice(1);
;

const getStoreInterface = (rootNode: ts.SourceFile, storeInterfaceName: string) => {
  return rootNode.forEachChild(child => {
    if (child.kind === ts.SyntaxKind.InterfaceDeclaration) {

      const childInterface = child as ts.InterfaceDeclaration;
      const interfaceName = childInterface.name.escapedText;

      if (interfaceName.toString() === storeInterfaceName) {
        console.log(interfaceName);
        return childInterface;
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
  
  console.log('storeName: ', storeName);

  const declarations = fs.readFileSync(filePath).toString();
  const rootNode = ts.createSourceFile('types.ts', declarations, ts.ScriptTarget.Latest);

  const storeInterface = getStoreInterface(rootNode, storeInterfaceName);

  if (!storeInterface) {
    throw new Error(`Interface ${storeInterfaceName} was not found in ${filePath}.`);
  }

  console.log({ storeInterface });

  const fieldNames = storeInterface.members.map(field => getName(field));

  const initiState =  Object.fromEntries(storeInterface.members.map(getInitialValues));
  
  
  
};