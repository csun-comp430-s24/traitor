import {
    TypeError,
    ConditionError,
    ItemError,
    RedeclarationError,
    UndeclaredError,

} from "./errors.js";
import * as util from 'util';

const defSet = new Set();
const structs = {} // basically a class
const traits = {} // contains methods
const impls = {} // applies a trait to a struct and gives definition of how
const functions = {}

function parseItem(item) {
    const className = item.class;
    if (className === 'StructDef') {
        const name = item.structName;
        if (defSet.has(name)) {
            throw new ItemError("Item has been declared twice with name: " + name);
        }
        defSet.add(name);

        structs[name] = {}
        item.params.list.forEach((param) => {
            structs[name][param.varName] = param.type.class
        })
    } else if (className === 'TraitDef') {
        const name = item.traitName;
        if (defSet.has(name)) {
            throw new ItemError("Item has been declared twice with name: " + name);
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
    } else if (className === 'ImplDef') {
        // let name = item.traitName
        // if (item.type.class === 'StructType') {
        //     name += item.type.structName
        // } else {
        //     name += item.type.class;
        // }
        const name = item.type.class === 'StructType' ? item.type.structName : item.type.class;
        const flag = !(name in impls)
        if (flag) {
            impls[name] = {};
            impls[name].forType = item.type.class === 'StructType' ? item.type.structName : item.type.class;
            impls[name].methods = {}
        }
        item.concMethods.forEach((method) => {
            impls[name].methods[method.methodName] = {};
            const temp = impls[name].methods[method.methodName];
            temp.returnType = method.type.class;
            temp.statements = method.stmts
            temp.inputs = {}
            method.params.list.forEach((param) => {
                temp.inputs[param.varName] = param.type.class;
            })
        })
    } else if (className === 'FuncDef') {
        const name = item.functionName; // idk
        functions[name] = {}
        functions[name].inputs = {}
        functions[name].statements = {}
        functions[name].returnType = item.type.class;
        item.params.list.forEach((param) => {
            functions[name].inputs[param.varName] = param.type;
        })
    } else {
        throw new ItemError("Item has invalid class name: " + className);
    }
}

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

// type is only relevant for SelfExp which is from items only
function getExpType(exp, varMap, type) {
    if (exp.class === 'BinOpExp') {
        const left = getExpType(exp.left, varMap, type)
        if (left != getExpType(exp.right, varMap, type)) {
            throw new Error('bin op left and right dont agree');
        }
        return left;
    } else if (exp.class === 'VarExp') {
        if (exp.name in varMap){
            return varMap[exp.name];
        }
        throw new Error('var not found in map');
    } else if (exp.class === 'SelfExp') {
        return type;
    } else if (exp.class === 'IntLitExp') {
        if (Number.isNaN(exp.value)) {
            // console.log(util.inspect(exp, false, null, true /* enable colors */));
            throw new Error("IntLitExp found with value not a number:");
        }
        return 'IntType';
    } else if (exp.class === 'TrueExp' || exp.class === 'FalseExp') {
        return 'BooleanType';
    } else if (exp.class === 'NewStructExp') {
        return exp.structName;
    } else if (exp.class === 'CallExp') {
        // console.log(util.inspect(exp, false, null, true));
        const primaryType = varMap[exp.call.primary.name];
        const impl = impls[primaryType];
        const method = impl.methods[exp.call.varName]

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

        return method.returnType === 'StructType' ? impl.forType : method.returnType;
    } else if (exp.class === 'DotExp') {
        
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
            throw new RedeclarationError("Variable " + statement.param.varName + " has already been declared");
        }
        const type = getExpType(statement.exp, varMap);
        if (type != getParamType(statement.param.type)) {
            throw new ConditionError("Attempted assigning type of " + type + " a new type of " + getParamType(statement.param.type))
        }
        varMap[statement.param.varName] = type;
        return varMap;
    } else if (className === 'VarStmt') {
        if (!(statement.varName in varMap)) {
            throw new UndeclaredError("Variable assigned to before declaration: " + statement.varName)
        }
        const expType = getExpType(statement.exp, varMap);
        if (expType != varMap[statement.varName]) {
            throw new ConditionError("Attempted assigning type of " + expType + " to variable of type " + varMap[statement.varName])
        }
        return varMap;
    } else if (className === 'IfStmt') {
        parseStatement(statement.condition, varMap);
        parseStatement(statement.trueBranch, varMap);
        return varMap;
    } else if (className === 'IfElseStmt') {
        parseStatement(statement.condition, varMap);
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
    } else if (className === 'ReturnStmt') {
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
    programItems.forEach((item) => {
        parseItem(item);
    })

    stmts.forEach((statement) => {
        varMap = parseStatement(statement, varMap);
    })

    return {"Variables": varMap};
}

