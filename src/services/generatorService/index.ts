import * as ts from 'typescript';
import * as fs from 'fs';
import path = require('path');

const capitalizeFirstLetter = (string: string) => 
 string.charAt(0).toUpperCase() + string.slice(1);
;

const getStoreInterface = (rootNode: ts.SourceFile, storeInterfaceName: string) => {
  rootNode.forEachChild(child => {
    if (child.kind === ts.SyntaxKind.InterfaceDeclaration) {

      const childInterface = child as ts.InterfaceDeclaration;
      const interfaceName = childInterface.name.escapedText;

      if (interfaceName.toString() === storeInterfaceName) {
        console.log(interfaceName);
        return childInterface;
      }
      
    }
   });
   return null;
};

export const generateDeoxFiles = async (filePath: string) => {
  
  const pathParts = path.dirname(filePath).split(path.sep);
  const storeName = pathParts[pathParts.length - 1];
  //NewsState
  const storeInterfaceName = `${capitalizeFirstLetter(storeName)}State`;
  
  console.log('storeName: ', storeName);

  const declarations = fs.readFileSync(filePath).toString();
  const rootNode = ts.createSourceFile('types.ts', declarations, ts.ScriptTarget.Latest);

  const storeInterface = getStoreInterface(rootNode, storeInterfaceName);

  if (storeInterface === null) {
    throw new Error(`Interface ${storeInterfaceName} was not found in ${filePath}.`);
  }
};