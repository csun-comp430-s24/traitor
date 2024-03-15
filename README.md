# Traitor
 A Haskell-like language featuring typeclasses, function overloading, and higher-order functions, which compiles to JavaScript.

 Authors: Nick Sercel, Kobi Sherman, Justin Reyes

## Concrete Syntax
```
var is a variable
structname is the name of a struct
traitname is the name of a trait (typeclass)
i is an integer

comma_type ::= [type (`,` type)*]

type ::=
  `Int` | `Void` | `Boolean` |   // Built-in types
  `Self` |                       // Refers to our own type in a trait
  structname |                   // Structs are a valid kind of type
  `(` type `)` |                 // Parenthesized type
  `(` comma_type `)` `=>` type   // Higher-order function

param ::= var `:` type

comma_param ::= [param (`,` param)*]

structdef ::= `struct` structname `{` comma_param `}`

// Definition of an abstract method
abs_methoddef ::= `method` var `(` comma_param `)` `:` type `;`

// Definition of a concrete method
conc_methoddef ::=
  `method` var `(` comma_param `)` `:` type `{` stmt* `}`

// Definition of a trait (typeclass)
traitdef ::= `trait` traitname `{` abs_methoddef* `}`

// Definition of an implementation of a typeclass
impldef ::= `impl` traitname `for` type `{` conc_methoddef* `}`

// Definition of a toplevel function
funcdef ::= `func` var `(` comma_param `)` `:` type
            `{` stmt* `}`

stmt ::= `let` param `=` exp `;` |               // Variable declaration
         var `=` exp `;` |                       // Assignment
         `if` `(` exp `)` stmt [`else` stmt] |   // if
         `while` `(` exp `)` stmt |              // while
         `break` `;` |                           // break
         `println` `(` exp `)` |                 // Printing something
         `{` stmt* `}` |                         // Block
         `return` [exp] `;` |                    // Return
         exp `;`                                 // Expression statements

struct_actual_param ::= var `:` exp

struct_actual_params ::=
  [struct_actual_param (`,` struct_actual_param)*]

primary_exp ::= i | var |            // Integers and variables
                `true` | `false` |   // Booleans
                `self` |             // Instance on which we call a method
                `(` exp `)` |        // Parenthesized expression
                // Creates a new instance of a struct
                `new` structname `{` struct_actual_params `}`

// Accessing a struct field or method
dot_exp ::= primary_exp (`.` var)*

call_exp ::= dot_exp (`(` comma_exp `)`)*

mult_exp ::= call_exp ((`*` | `/`) call_exp)*

add_exp ::= mult_exp ((`+` | `-`) mult_exp)*

less_than_exp ::= add_exp [`<` add_exp]

equals_exp ::= less_than_exp [(`==` | `!=`) less_than_exp]

exp ::= equals_exp

program_item ::= structdef | traitdef | impldef | funcdef

program ::= program_item* stmt* stmt* is the entry point
```

## How To Run Tests
```
Run `npm install jest` in terminal
Run `npm test` to get test results and code coverage report
```
