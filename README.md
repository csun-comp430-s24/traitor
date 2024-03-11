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
&nbsp;&nbsp;\`Int\` | \`Void\` | \`Boolean\` | __Built-in types__\
&nbsp;&nbsp;\`Self\` | __Refers to our own type in a trait__\
&nbsp;&nbsp;structname | __Structs are a valid kind of type__\
&nbsp;&nbsp;\`(\` type \`)\` | __Parenthesized type__\
&nbsp;&nbsp;\`(\` comma_type \`)\` \`=\` type __Higher-order function__\
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
&nbsp;&nbsp;\`method\` var (\` comma_param \`)\` \`:\` type \`{\` stmt\* \`}\`\
\
__Definition of a trait (typeclass)__\
traitdef ::= \`trait\` traitname \`{\` abs_methoddef\* \`}\`\
\
__Definition of an implementation of a typeclass__\
impldef ::= \`impl\` traitname \`for\` type \`{\` conc_methoddef\* \`}\`\
\
__Definition of a toplevel function__\
funcdef ::= \`func\` var \`(\` comma_param \`)\` \`:\` type\
&nbsp;&nbsp;\`{\` stmt* \`}\`\
\
stmt ::= \`let\` param \`=\` exp \`;\` | __Variable declaration__\
&nbsp;&nbsp;var \`=\` exp \`;\` | __Assignment__\
&nbsp;&nbsp;\`if\` \`(\` exp \`)\` stmt [\`else\` stmt] | __if__\
&nbsp;&nbsp;\`while\` \`(\` exp \`)\` stmt | __while__\
&nbsp;&nbsp;\`break\` \`;\` | __break__\
&nbsp;&nbsp;\`println\` \`(\` exp \`)\` | __Printing something__\
&nbsp;&nbsp;\`{\` stmt* \`}\` | __Block__\
&nbsp;&nbsp;\`return\` [exp] \`;\` | __Return__\
&nbsp;&nbsp;exp \`;\` __Expression statements__\
\
struct_actual_param ::= var \`:\` exp\
\
struct_actual_params ::=\
&nbsp;&nbsp;[struct_actual_param (\`,\` struct_actual_param)*]\
\
primary_exp ::= i | var | __Integers and variables__\
&nbsp;&nbsp;\`true\` | \`false\` | __Booleans__\
&nbsp;&nbsp;\`self\` | __Instance on which we call a method__\
&nbsp;&nbsp;\`(\` exp \`)\` | __Parenthesized expression__\
&nbsp;&nbsp;__Creates a new instance of a struct__\
&nbsp;&nbsp;\`new\` structname \`{\` struct_actual_params \`}\`\
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
