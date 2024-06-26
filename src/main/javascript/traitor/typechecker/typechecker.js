import {
    TypeError,
    RedeclarationError,
    UndeclaredError,

} from "./errors.js";

var defSet = new Set();
var structs = {}; // basically a class
var traits = {}; // contains methods
var impls = {}; // applies a trait to a struct and gives definition of how
var implMethods = {};
var functions = {};

function parseItem(item) {
    const className = item.class;
    if (className === 'StructDef') {
        let name = item.structName;

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
        // console.log(util.inspect({"structs:": structs}, false, null, true));
    } else if (className === 'TraitDef') {
        let name = item.traitName;

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
        // (util.inspect({"traits:": traits}, false, null, true));
    } else if (className === 'ImplDef') {
        const name = item.traitName;
        // console.log(util.inspect({"ImplDef:": item}, false, null, true));

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

            method.params.list.forEach((param) => {
                temp.inputs[param.varName] = getParamType(param.type);
            })
            
            // Checking if the parameters between the abstract and concrete method definitions match
            for (const [key, value] of Object.entries(temp.inputs)) {
                var absParamType = traits[name][method.methodName].inputs[key];
                if (absParamType === 'SelfType') {
                    absParamType = forType;
                }
                if (value !== absParamType)
                    throw new TypeError("Expected param type " + absParamType + " for method `" + method.methodName + "`; instead received " + value);
            }

            //check if statement types match the return type
            //method.type == method.stmts.
            // console.log(util.inspect(method, false, null, true));
        })
        // console.log("Methods for " + forType + ": ");
        // console.log(implMethods[forType]);
    } else if (className === 'FuncDef') {
        let name = item.varName;
        item.params.list.forEach((param) => {
            name += getParamType(param.type);
        })
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
}

function getStatementsReturnType(stmts, varMap, type)
{
    var returnType = 'VoidType';
    stmts.forEach((stmt) => {
        returnType = getStatementReturnType(stmt, varMap, type);
        if(returnType != 'VoidType') return returnType;
    })
    return returnType;
}

//assumes that statement has been typechecked for consistency already
function getStatementReturnType(statement, varMap, type) {
    const className = statement.class;
    // console.log(statement);
    if (className == 'LetStmt') {
        if (statement.param.varName in varMap) {
            throw new RedeclarationError("Variable `" + statement.param.varName + "` has already been declared");
        }
        const assignType = getExpType(statement.exp, varMap, type);
        if (assignType != getParamType(statement.param.type)) {
            throw new TypeError("Attempted assigning type of " + assignType + " to new variable `" + statement.param.varName + "` of type " + getParamType(statement.param.type))
        }
        varMap[statement.param.varName] = assignType;
        return 'VoidType'
    } else if (className === 'VarStmt') {
        if (!(statement.varName in varMap)) {
            throw new UndeclaredError("Variable assigned to before declaration: " + statement.varName)
        }
        const expType = getExpType(statement.exp, varMap);
        if (expType != varMap[statement.varName]) {
            throw new TypeError("Attempted assigning type of " + expType + " to variable `" + statement.varName + "` of type " + varMap[statement.varName])
        }
        return 'VoidType'
    } else if (className === 'IfStmt') {
        return getStatementReturnType(statement.trueBranch, varMap);
    } else if (className === 'IfElseStmt') {
        const trueReturn = getStatementReturnType(statement.trueBranch, varMap);
        const falseReturn = getStatementReturnType(statement.falseBranch, varMap);
        if (trueReturn !== falseReturn) throw new TypeError("Mismatch of return types in if/else statement; if returns type " + trueReturn + "; else returns type " + falseReturn);
        return getStatementReturnType(statement.falseBranch, varMap); //assuming it is already checked for consistency
    } else if (className === 'WhileStmt') {
        return getStatementReturnType(statement.body, varMap);
    } else if (className === 'BreakStmt') {
        return 'VoidType';
    } else if (className === 'PrintlnStmt') {
        return 'VoidType'
    } else if (className === 'BlockStmt') {
        return getStatementsReturnType(statement.stmtList, varMap);
    } else if (className === 'ReturnExpStmt') {
        return getExpType(statement.exp, varMap, type);
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
        // console.log(util.inspect(exp, false, null, true));
        if (exp.varName in varMap){
            return varMap[exp.varName];
        }
        throw new UndeclaredError('`' + exp.varName + '` is not defined');
    } else if (exp.class === 'SelfExp') {
        return type;
    } else if (exp.class === 'IntLitExp') {
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
        const methodName = exp.call.varName;
        const receivedParams = exp.params.list;
        var expectedParams;
        var returnType;

        // console.log({"Method called":methodName});

        // Checking if method is from an impl
        if (exp.call.class === 'DotExp') {
            returnType = getExpType(exp.call, varMap, type);
            const primaryType = getExpType(exp.call.primary, varMap);
            // console.log(util.inspect({"Expected Params":implMethods[primaryType].methods[methodName].inputs}, false, null, true));
            expectedParams = implMethods[primaryType].methods[methodName].inputs;
        }

        // Checking if method is a func
        if (exp.call.class === 'VarExp') {
            let varName = exp.call.varName;
            // console.log(receivedParams);
            receivedParams.forEach((param) => {
                varName += getExpType(param);
            })
            let newCaller = { class: 'VarExp', varName};
            returnType = getExpType(newCaller, varMap);
            // console.log(util.inspect({"Expected Params":functions[methodName].inputs}, false, null, true));
            expectedParams = functions[varName].inputs;
        }

        /* Initially meant to check if parameters on a function call match the function, this is now handled by function overloading checks
        var accum = 0;
        for (const [key, value] of Object.entries(expectedParams)) {
            const expectedParamType = value;
            const receivedParamType = getExpType(receivedParams[accum], varMap);
            if (expectedParamType !== receivedParamType) {
                throw new TypeError("Expected param type " + expectedParamType + " for method `" + methodName + "`; instead received " + receivedParamType);
            }
            accum += 1;
        }*/
        // console.log(util.inspect({"Call Params":exp.params.list}, false, null, true));

        return returnType;
    } else if (exp.class === 'DotExp') {
        const variable = exp.varName;

        // Getting type of primary
        const primaryType = getExpType(exp.primary, varMap, type);

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

    programItems.forEach((item) => {
        if(item.class == 'ImplDef')
        {
            item.concMethods.forEach((method) => {
                const expectedType = getParamType(method.type);
                const localVarMap = {};
                method.params.list.forEach((param) => {
                    localVarMap[param.varName] = getParamType(param.type);
                })
                const calculatedType = getStatementsReturnType(method.stmts, localVarMap, getParamType(item.type));
                if(expectedType != calculatedType) throw new TypeError("Return Type mismatch in `" + method.methodName + "` method. Expected " + expectedType + ", returning " + calculatedType);
            })
        }
        else if(item.class == 'FuncDef')
        {
            const expectedType = getParamType(item.type);
            const localVarMap = {};
            let currentVarName = item.varName;
            item.params.list.forEach((param) => {
                localVarMap[param.varName] = getParamType(param.type);
                currentVarName += getParamType(param.type);
            })
            const calculatedType = getStatementsReturnType(item.stmts, localVarMap);
            if(expectedType != calculatedType) throw new TypeError("Return Type mismatch in `" + currentVarName + "` method. Expected " + expectedType + ", returning " + calculatedType);
        }
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