import { builtinModules } from "module";
import {
    TypeError,
    ConditionError,
    ItemError,
    RedeclarationError,
    UndeclaredError,

} from "./errors.js";
import * as util from 'util';

var defSet = new Set();
var structs = {}; // basically a class
var traits = {}; // contains methods
var impls = {}; // applies a trait to a struct and gives definition of how
var implMethods = {};
var functions = {};
const builtInTypes = new Set(
    ['IntType', 'VoidType', 'BooleanType']
)

function parseItem(item) {
    const className = item.class;
    if (className === 'StructDef') {
        const name = item.structName;
        if (defSet.has(name)) {
            throw new ItemError("Item has been declared twice with name: `" + name + "`");
        }
        defSet.add(name);

        structs[name] = {}
        item.params.list.forEach((param) => {
            structs[name][param.varName] = param.type.class
        })
    } else if (className === 'TraitDef') {
        const name = item.traitName;
        if (defSet.has(name)) {
            throw new ItemError("Item has been declared twice with name: `" + name + "`");
        }
        defSet.add(name);

        traits[name] = {}
        item.absMethods.forEach((method) => {
            traits[name][method.methodName] = {}
            traits[name][method.methodName].returnType = method.type.class;
            traits[name][method.methodName].inputs = [];
            method.params.list.forEach((param) => {
                traits[name][method.methodName].inputs[param.varName] = param.type.class;
            })
        })
        // console.log(traits[name])
    } else if (className === 'ImplDef') {
        const name = item.traitName;
        const forType = item.type.class === 'StructType' ? item.type.structName : item.type.class;

        // Checking if trait exists
        if (!traits[name]) {
            throw new UndeclaredError("Attempted implementation of non-existent trait `" + name + "`");
        }
        // Checking if type exists for impl
        if (!(builtInTypes.has(forType)) && !(structs[forType])) {
            throw new TypeError("Attempted implementation of trait " + name + " to non-existent type `" + forType + "`");
        }
        // Checking if impl has not been made yet
        if (!(impls[name])) {
            impls[name] = {};
            impls[name].forTypes = new Set();
        }
        // Checking if impl has already been done for the given type
        if (impls[name].forTypes.has(forType)) {
            throw new RedeclarationError("Trait " + name + " has already been implemented for " + forType);
        }
        impls[name].forTypes.add(forType);
        // console.log(impls[name].forTypes);
        
        // Checking if traits have previously been implemented for the given type
        if (!(implMethods[forType])) {
            implMethods[forType] = {};
            implMethods[forType].methods = {};
        }

        // Iterating over each method and assigning them to the given type
        item.concMethods.forEach((method) => {
            // Checking if method exists in the trait definition
            if (!traits[name][method.methodName]) {
                throw new UndeclaredError("Method `" + method.methodName + "` does not exist in trait " + name);
            }
            const abstractMethod = traits[name][method.methodName];
            implMethods[forType].methods[method.methodName] = {};
            const temp = implMethods[forType].methods[method.methodName];
            temp.returnType = getParamType(method.type);

            // Fetching the return type of the abstract method
            var absReturnType = abstractMethod.returnType;
            if (absReturnType === 'SelfType') {
                absReturnType = forType;
            }

            // Checking if the return type of the concrete method matches the abstract method
            if (temp.returnType !== absReturnType) {
                throw new TypeError("Attempted assigning return type of " + temp.returnType + " to method `" + method.methodName + "` which needs return type " + absReturnType);
            }
            
            temp.statements = method.stmts
            temp.inputs = {}
            console.log("Trait method: ");
            console.log(util.inspect(traits[name][method.methodName], false, null, true /* enable colors */))
            console.log("Impl method: ");
            console.log(util.inspect(method, false, null, true /* enable colors */));
            method.params.list.forEach((param) => {
                temp.inputs[param.varName] = param.type.class;
            })
        })
        // console.log("Methods for " + forType + ": ");
        // console.log(implMethods[forType]);
    } else if (className === 'FuncDef') {
        const name = item.varName;
        functions[name] = {}
        functions[name].inputs = {}
        functions[name].statements = {}
        functions[name].returnType = item.type.class;
        item.params.list.forEach((param) => {
            functions[name].inputs[param.varName] = param.type;
        })
    }
    // This else statement would be a parser problem 
    // else {             
    //    throw new ItemError("Item has invalid class name: " + className);
    // }
}

/* This function isn't used
function testCondition(className, value, varMap) {
    if (className === 'IntType') {
        if (!(value instanceof Number))
            throw new Error();
    } else if (className === 'BooleanType') {
        if (!(value instanceof Boolean))
            throw new Error();
    } else if (className === 'Var') {
        if (value in varMap)
            throw new Error();
    }
}
*/

// type is only relevant for SelfExp which is from items only
function getExpType(exp, varMap, type) {
    if (exp.class === 'BinOpExp') {
        const left = getExpType(exp.left, varMap, type)
        if (left != getExpType(exp.right, varMap, type)) {
            throw new TypeError('Attempted binary operation between ' + left + ' and ' + getExpType(exp.right, varMap, type));
        }
        return left;
    } else if (exp.class === 'VarExp') {
        if (exp.name in varMap){
            return varMap[exp.name];
        }
        throw new UndeclaredError('Variable `' + exp.name + '` has not been declared');
    } else if (exp.class === 'SelfExp') {
        return type;
    } else if (exp.class === 'IntLitExp') {
        // This if statement is a tokenizer problem
        // if (Number.isNaN(exp.value)) {               
        //     // console.log(util.inspect(exp, false, null, true /* enable colors */));
        //     throw new Error("IntLitExp found with value not a number:");
        // }
        return 'IntType';
    } else if (exp.class === 'TrueExp' || exp.class === 'FalseExp') {
        return 'BooleanType';
    } else if (exp.class === 'NewStructExp') {
        return exp.structName;
    } else if (exp.class === 'CallExp') {
        // console.log(util.inspect(exp, false, null, true));
        const primaryType = varMap[exp.call.primary.name];
        const availableMethods = implMethods[primaryType].methods;
        if (!availableMethods[exp.call.varName]) {
            throw new UndeclaredError("Method `" + exp.call.varName + "` does not exist for type " + primaryType);
        }

        const method = availableMethods[exp.call.varName];
        /*
        for (const [key, value] of Object.entries(method.inputs)) {
            if (value === 'StructType') {
                varMap[key] = impl.forType;
            } else {
                varMap[key] = value;
            }
        }
        method.statements.forEach((statement) => {
            getExpType(statement.exp, varMap, primaryType);
        })
        for (const [key, value] of Object.entries(method.inputs)) {
            delete varMap[key]; 
        }
        */

        return method.returnType === 'StructType' ? primaryType : method.returnType;
    } else if (exp.class === 'DotExp') {
        // Accessing struct fields
        const primaryType = getExpType(exp.primary, varMap);
        if (structs[primaryType]) {
            const variable = exp.varName;
            // console.log(structs[primaryType]);
            if (structs[primaryType][variable])
                return structs[primaryType][variable];
        }
        // Accessing methods
        
    } else if (exp.class === 'DoubleEqualsExp') {
        const left = getExpType(exp.left, varMap);
        const right = getExpType(exp.right, varMap);
        if (left === right) return left;
        throw new ConditionError("Cannot compare expression of type " + left + " to expression of type " + right);
    } else if (exp.class === 'NotEqualsExp') {
        const left = getExpType(exp.left, varMap);
        const right = getExpType(exp.right, varMap);
        if (left === right) return left;
        throw new ConditionError("Cannot compare expression of type " + left + " to expression of type " + right);
    } else if (exp.class === 'LessThanExp') {
        const left = getExpType(exp.left, varMap);
        const right = getExpType(exp.right, varMap);
        if (left === right) return left;
        throw new ConditionError("Cannot compare expression of type " + left + " to expression of type " + right);
    } else {
        console.log(util.inspect(exp, false, null, true /* enable colors */));
        throw new Error("Missing class for expression");
    }
}

function getParamType(type) {
    if (type.class === 'StructType') {
        return type.structName;
    }
    return type.class;
}

function parseStatement(statement, varMap = {}) {
    // console.log("varMap:", varMap);
    // console.log("Evaluating statement:", statement);
    const className = statement.class;
    if (className == 'LetStmt') {
        if (statement.param.varName in varMap) {
            throw new RedeclarationError("Variable `" + statement.param.varName + "` has already been declared");
        }
        const type = getExpType(statement.exp, varMap);
        if (!(builtInTypes.has(type)) && !(structs[type])) {
            throw new TypeError("Attempted assigning non-existent type `" + type + "`" + " to variable `" + statement.param.varName + "`")
        }
        if (type != getParamType(statement.param.type)) {
            throw new TypeError("Attempted assigning type of " + type + " to new variable `" + statement.param.varName + "` of type " + getParamType(statement.param.type))
        }
        varMap[statement.param.varName] = type;
        return varMap;
    } else if (className === 'VarStmt') {
        if (!(statement.varName in varMap)) {
            throw new UndeclaredError("Variable assigned to before declaration: " + statement.varName)
        }
        const expType = getExpType(statement.exp, varMap);
        if (expType != varMap[statement.varName]) {
            throw new TypeError("Attempted assigning type of " + expType + " to variable `" + statement.varName + "` of type " + varMap[statement.varName])
        }
        return varMap;
    } else if (className === 'IfStmt') {
        const expType = getExpType(statement.condition, varMap);
        parseStatement(statement.trueBranch, varMap);
        return varMap;
    } else if (className === 'IfElseStmt') {
        const expType = getExpType(statement.condition, varMap);
        parseStatement(statement.trueBranch, varMap);
        parseStatement(statement.falseBranch, varMap);
        return varMap;
    } else if (className === 'WhileStmt') {
        // check valid condition type
        const conditionType = getExpType(statement.condition, varMap);
        parseStatement(statement.body, varMap);
        return varMap;
    } else if (className === 'BreakStmt') {
        return varMap;
    } else if (className === 'PrintlnStmt') {
        const conditionType = getExpType(statement.exp, varMap);
        return varMap;
    } else if (className === 'BlockStmt') {
        // recursively check operands for validity
        statement.stmtList.forEach((stmt) => {
            varMap = parseStatement(stmt, varMap);
        })
        return varMap;
    } else if (className === 'ReturnExpStmt') {
        const conditionType = getExpType(statement.exp, varMap);
        return varMap;
    } else if (className === 'ExpStmt') {
        const conditionType = getExpType(statement.exp, varMap);
        return varMap;
    } else {
        throw new TypeError("Invalid statement: " + statement);
    }
}


export function typecheck({programItems, stmts}) {
    let varMap = {};
    defSet = new Set();
    structs = {};
    traits = {};
    impls = {};
    implMethods = {};
    functions = {};
    programItems.forEach((item) => {
        parseItem(item);
    })

    stmts.forEach((statement) => {
        varMap = parseStatement(statement, varMap);
    })

    return {"Variables": varMap};
}

export function checkImpl() {
    return impls;
}
