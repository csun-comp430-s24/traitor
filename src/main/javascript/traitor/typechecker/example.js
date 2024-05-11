const expected = {
    class: 'Program',
    programItems: [
        {
          class: 'StructDef',
          structName: 's',
          params: { class: 'CommaParam', list: [] }
        },
        { class: 'TraitDef', traitName: 't', absMethods: [] },
        {
          class: 'ImplDef',
          traitName: 't1',
          type: { class: 'VoidType' },
          concMethods: []
        },
        {
          class: 'FuncDef',
          varName: 'foo',
          params: { class: 'CommaParam', list: [] },
          type: { class: 'IntType' },
          stmts: [{
              class: 'ReturnExpStmt',
              exp: { class: 'IntLitExp', value: 5 }
            }
          ]
        }
      ],
    stmts: [{
            class: 'BlockStmt',
            stmtList: [{
                class: 'VarStmt',
                varName: 'x',
                exp: { class: 'IntLitExp', value: 7 }
            }]
    }]
}
