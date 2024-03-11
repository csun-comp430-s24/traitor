# Traitor
 A Haskell-like language featuring typeclasses, function overloading, and higher-order functions, which compiles to JavaScript.

## Concrete Syntax
*var* is a variable\
*structname* is the name of a struct\
*traitname* is the name of a trait (typeclass)\
*i* is an integer\
\
comma_type ::= [type (\`,\` type)\*]\
\
type ::=\
 \`Int\` | \`Void\` | \`Boolean\` | __Built-in types__\
 \`Self\` | __Refers to our own type in a trait__\
structname | __Structs are a valid kind of type__\
\`(\` type \`)\` | __Parenthesized type__\
\`(\` comma_type \`)\` \`=\` type __Higher-order function__\
\
param ::= var \`:\` type\
\
comma_param ::= [param (\`,\` param)\*]\
\
structdef ::= \`struct\` structname \`{\` comma_param \`}\`\
\
__Definition of an abstract method__\
abs_methoddef ::= \`method\` var (\` comma_param \`)\` \`:\` type \`;\`\
\
__Definition of a concrete method__\
conc_methoddef ::=\
\`method\` var (\` comma_param \`)\` \`:\` type \`{\` stmt\* \`}\`\
\
__Definition of a trait (typeclass)__\
traitdef ::= \`trait\` traitname \`{\` abs_methoddef\* \`}\`\
\
__Definition of an implementation of a typeclass__\
impldef ::= \`impl\` traitname \`for\` type \`{\` conc_methoddef\* \`}\`\
\
__Definition of a toplevel function__\
funcdef ::= \`func\` var \`(\` comma_param \`)\` \`:\` type\
\`{\` stmt* \`}\`\
\
stmt ::= \`let\` param \`=\` exp \`;\` | __Variable declaration__\
var \`=\` exp \`;\` | __Assignment__\
\`if\` \`(\` exp \`)\` stmt [\`else\` stmt] | __if__\
\`while\` \`(\` exp \`)\` stmt | __while__\
\`break\` \`;\` | __break__\
\`println\` \`(\` exp \`)\` | __Printing something__\
\`{\` stmt* \`}\` | __Block__\
\`return\` [exp] \`;\` | __Return__\
exp \`;\` __Expression statements__\
\
struct_actual_param ::= var \`:\` exp\
\
struct_actual_params ::=\
[struct_actual_param (\`,\` struct_actual_param)*]\
\
primary_exp ::= i | var | __Integers and variables__\
\`true\` | \`false\` | __Booleans__\
\`self\` | __Instance on which we call a method__\
\`(\` exp \`)\` | __Parenthesized expression__\
__Creates a new instance of a struct__\
\`new\` structname \`{\` struct_actual_params \`}\`\
\
__Accessing a struct field or method__\
dot_exp ::= primary_exp (\`.\` var)\*\
\
call_exp ::= dot_exp (\`(\` comma_exp \`)\`)\*\
\
mult_exp ::= call_exp ((\`\*\` | \`/\`) call_exp)\*\
\
add_exp ::= mult_exp ((\`+\` | \`-\`) mult_exp)\*\
\
less_than_exp ::= add_exp [\`<\` add_exp]\
\
equals_exp ::= less_than_exp [(\`==\` | \`!=\`) less_than_exp]\
\
exp ::= equals_exp\
\
program_item ::= structdef | traitdef | impldef | funcdef\
\
program ::= program_item\* stmt\* __stmt\* is the entry point__
