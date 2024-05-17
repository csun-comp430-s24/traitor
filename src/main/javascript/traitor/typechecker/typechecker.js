import { builtinModules } from "module";
import {
    TypeError,
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

function parseItem(item) {
    const className = item.class;
    if (className === 'StructDef') {
        const name = item.structName;

        // Checking if an item with the same name has already been declared
        if (defSet.has(name)) {
            throw new RedeclarationError("Item has been declared more than once with name: `" + name + "`");
        }
        defSet.add(name);

        structs[name] = {};
        item.params.list.forEach((param) => {
            // Checking if struct parameter has already been declared
            if (structs[name][param.varName]) {
                throw new RedeclarationError("Parameter `" + param.varName + "` has been declared more than once for struct `" + name + "`");
            }
            structs[name][param.varName] = getParamType(param.type);
        })
    } else if (className === 'TraitDef') {
        const name = item.traitName;

        // Checking if an item with the same name has already been declared
        if (defSet.has(name)) {
            throw new RedeclarationError("Item has been declared more than once with name: `" + name + "`");
        }
        defSet.add(name);

        traits[name] = {}
        item.absMethods.forEach((method) => {
            traits[name][method.methodName] = {}
            traits[name][method.methodName].returnType = getParamType(method.type);
            traits[name][method.methodName].inputs = {};
            method.params.list.forEach((param) => {
                traits[name][method.methodName].inputs[param.varName] = getParamType(param.type);
            })
        })
    } else if (className === 'ImplDef') {
        const name = item.traitName;

        // Checking if trait exists
        if (!traits[name]) {
            throw new UndeclaredError("Attempted implementation of non-existent trait `" + name + "`");
        }
        
        const forType = getParamType(item.type);

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
            // console.log("Trait method: ");
            // console.log(util.inspect(traits[name][method.methodName], false, null, true /* enable colors */))
            // console.log("Impl method: ");
            // console.log(util.inspect(method, false, null, true /* enable colors */));

            method.params.list.forEach((param) => {
                temp.inputs[param.varName] = getParamType(param.type);
            })

            //check if statement types match the return type
            //method.type == method.stmts.
            console.log(JSON.stringify(method));
        })
        // console.log("Methods for " + forType + ": ");
        // console.log(implMethods[forType]);
    } else if (className === 'FuncDef') {
        const name = item.varName;
        if (defSet.has(name)) {
            throw new RedeclarationError("Item has been declared more than once with name: `" + name + "`");
        }
        defSet.add(name);

        functions[name] = {}
        functions[name].inputs = {}
        functions[name].statements = {}
        functions[name].returnType = getParamType(item.type);
        item.params.list.forEach((param) => {
            functions[name].inputs[param.varName] = getParamType(param.type);
        })
    }
    // This else statement would be a parser problem 
    // else {             
    //    throw new RedeclarationError("Item has invalid class name: " + className);
    // }
}

function getStatementsReturnType(stmts, varMap)
{
    var returnType = 'VoidType';
    stmts.forEach((stmt) => {
        returnType = getStatementReturnType(stmt, varMap);
        if(returnType != 'VoidType') return returnType;
    })
    return returnType;
}

//assumes that statement has been typechecked for consistency already
function getStatementReturnType(statement, varMap) {
    const className = statement.class;
    if (className == 'LetStmt') {
        return 'VoidType'
    } else if (className === 'VarStmt') {
        return 'VoidType'
    } else if (className === 'IfStmt') {
        return getStatementType(statement.trueBranch, varMap);
    } else if (className === 'IfElseStmt') {
        return getStatementType(statement.falseBranch, varMap); //assuming it is already checked for consistency
    } else if (className === 'WhileStmt') {
        return getStatementType(statement.body, varMap);
    } else if (className === 'BreakStmt') {
        return 'VoidType';
    } else if (className === 'PrintlnStmt') {
        return 'VoidType'
    } else if (className === 'BlockStmt') {
        getStatementsReturnType(statement.stmtList, varMap);
    } else if (className === 'ReturnExpStmt') {
        return getExpType(statement.exp, varMap);
    } else if (className === 'ReturnStmt') {
        return 'VoidType';
    } else if (className === 'ExpStmt') {
        return 'VoidType';
    } else {
        throw new TypeError("Invalid statement: " + statement);
    }
}

// type is only relevant for SelfExp which is from items only
function getExpType(exp, varMap, type) {
    if (exp.class === 'BinOpExp') {
        const left = getExpType(exp.left, varMap, type)
        if (left != getExpType(exp.right, varMap, type)) {
            throw new TypeError('Attempted binary operation between ' + left + ' and ' + getExpType(exp.right, varMap, type));
        }
        return left;
    } else if (exp.class === 'VarExp') {
        if (exp.varName in varMap){
            return varMap[exp.varName];
        }
        throw new UndeclaredError('`' + exp.varName + '` is not defined');
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
        if (!structs[exp.structName]) {
            throw new UndeclaredError("`" + exp.structName + "` is not defined");
        }
        return exp.structName;
    } else if (exp.class === 'CallExp') {
        // console.log(util.inspect(exp, false, null, true));
        const returnType = getExpType(exp.call, varMap);
        const methodName = exp.call.varName;
        const receivedParams = exp.params.list;
        var expectedParams;

        // console.log({"Method called":methodName});

        // Checking if method is from an impl
        if (exp.call.class === 'DotExp') {
            const primaryType = getExpType(exp.call.primary, varMap);
            // console.log(util.inspect({"Expected Params":implMethods[primaryType].methods[methodName].inputs}, false, null, true));
            expectedParams = implMethods[primaryType].methods[methodName].inputs;
        }

        // Checking if method is a func
        if (exp.call.class === 'VarExp') {
            // console.log(util.inspect({"Expected Params":functions[methodName].inputs}, false, null, true));
            expectedParams = functions[methodName].inputs;
        }

        var accum = 0;
        for (const [key, value] of Object.entries(expectedParams)) {
            const expectedParamType = value;
            const receivedParamType = getExpType(receivedParams[accum]);
            // console.log({"Expected Param Type": expectedParamType});
            // console.log({"Received Param Type": receivedParamType});
            if (expectedParamType !== receivedParamType) {
                throw new TypeError("Expected param type " + expectedParamType + " for method `" + methodName + "`; instead received " + receivedParamType);
            }
            accum += 1;
        }
        // console.log(util.inspect({"Call Params":exp.params.list}, false, null, true));

        return returnType;
    } else if (exp.class === 'DotExp') {
        const variable = exp.varName;

        // Getting type of primary
        const primaryType = getExpType(exp.primary, varMap);

        // Checking if type contains methods
        if (implMethods[primaryType]) {
            // Checking if method is accessible to type
            if (implMethods[primaryType].methods[variable]) {
                const method = implMethods[primaryType].methods[variable];

                // Checking return type of method
                // console.log({"Method": method});
                return method.returnType;
            }
        }

        // Accessing struct fields and checking parameter type
        if (structs[primaryType] && structs[primaryType][variable]) {
            return structs[primaryType][variable];
        }
        throw new UndeclaredError("`" + variable + "` cannot be accessed by type " + primaryType);
    } else if (exp.class === 'DoubleEqualsExp') {
        const left = getExpType(exp.left, varMap);
        const right = getExpType(exp.right, varMap);
        if (left === right) return left;
        throw new TypeError("Cannot compare expression of type " + left + " to expression of type " + right);
    } else if (exp.class === 'NotEqualsExp') {
        const left = getExpType(exp.left, varMap);
        const right = getExpType(exp.right, varMap);
        if (left === right) return left;
        throw new TypeError("Cannot compare expression of type " + left + " to expression of type " + right);
    } else if (exp.class === 'LessThanExp') {
        const left = getExpType(exp.left, varMap);
        const right = getExpType(exp.right, varMap);
        if (left === right) return left;
        throw new TypeError("Cannot compare expression of type " + left + " to expression of type " + right);
    } else if (exp.class === 'ParenExp') {
        const type = getExpType(exp.exp, varMap);
        return type;
    } else {
        // console.log(util.inspect(exp, false, null, true /* enable colors */));
        throw new Error("Missing class for expression" + exp.class);
    }
}

function getParamType(type) {
    if (type.class === 'StructType') {
        if (!structs[type.structName]) throw new UndeclaredError("`" + type.structName + "` is not defined");
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
    } else if (className === 'ReturnStmt') {
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

    // Adding function names to varMap with return type
    defSet.forEach((itemName) => {
        if (functions[itemName])
            varMap[itemName] = functions[itemName].returnType;
    })

    stmts.forEach((statement) => {
        varMap = parseStatement(statement, varMap);
    })

    return {"Variables": varMap};
}