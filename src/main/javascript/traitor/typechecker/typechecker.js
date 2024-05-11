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
        let name = item.traitName
        if (item.type.class === 'StructType') {
            name += item.type.structName
        } else {
            name += item.type.class;
        }
        impls[name] = {}
        impls[name].forType = item.type.class;
        impls[name].methods = {}
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
        const left = getExpType(exp.left)
        if (left != getExpType(exp.right)) {
            throw new Error();
        }
        return left;
    } else if (exp.class === 'VarExp') {
        if (exp.value in varMap)
        return 'Var';
    } else if (exp.class === 'SelfExp') {
        return type;
    } else if (exp.class === 'IntLitExp') {
        if (!(exp.value instanceof Number)) {
            throw new Error();
        }
        return 'IntType';
    } else if (exp.class === 'TrueExp' || exp.class === 'FalseExp') {
        return 'BooleanType';
    }
}

function parseStatement(statement, varMap) {
    const className = statement.class;
    if (className == 'LetStmt') {
        if (statement.param.varName in varMap) {
            throw new RedeclarationError("Variable", statement.varName, "has already been declared");
        }
        if (getExpType(statement.exp) != statement.param.type.class) {
            throw new ConditionError("Attempted assigning type of", statement.param.type.class, "a value of", statement.exp.value)
        }
        varMap[statement.param.varName] = {
            class: statement.param.type.class,
            value: statement.exp.value
        };
        return varMap;
    } else if (className === 'VarStmt') {
        if (notDeclared(statement.varName, varMap)) {
            throw new UndeclaredError("Variable assigned to before declaration:", statement)
        }
        const expType = getExpType(statement.exp);
        if (expType != varMap[statement.varName].class) {
            throw new ConditionError("Attempted assigning type of", expType, "to variable of type", varMap[statement.varName].class)
        }
        varMap[statement.varName].value = statement.exp.value; // not needed but for fun
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
        const conditionType = getExpType(statement.condition);
        parseStatement(statement.body, varMap);
        return varMap;
    } else if (className === 'BreakStmt') {
        return varMap;
    } else if (className === 'PrintlnStmt') {
        const conditionType = getExpType(statement.exp);
        return varMap;
    } else if (className === 'BlockStmt') {
        // recursively check operands for validity
        statement.stmtList.forEach((stmt) => {
            varMap = parseStatement(stmt, varMap);
        })
        return varMap;
    } else if (className === 'ReturnStmt') {
        const conditionType = getExpType(statement.exp);
        return varMap;
    } else if (className === 'ExpStmt') {
        const conditionType = getExpType(statement.exp);
        return varMap;
    } else {
        throw new TypeError("Invalid statement:", statement);
    }
}


export function typecheck({programItems, stmts}) {
    programItems.forEach((item) => {
        parseItem(item);
    })

    stmts.forEach((statement) => {
        parseStatement(statement);
    })

    return {
        traits,
        structs,
        impls,
        functions,
    };
}

