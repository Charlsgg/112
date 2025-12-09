export const KEYWORDS = [
  // Output
  { label: 'ilimbag "text"', detail: "Print String", desc: "Prints text to the console" },
  { label: 'ilimbag variable', detail: "Print Variable", desc: "Prints a variable value" },
  { label: 'ilimbag "text", variable', detail: "Print Mixed", desc: "Prints text and variables together" },

  // Data Types
  { label: "numero var_name", detail: "Integer Declaration", desc: "Declares a whole number variable" },
  { label: "numero var_name = 10", detail: "Integer Init", desc: "Declares and initializes an integer" },
  
  { label: "desimal var_name", detail: "Float Declaration", desc: "Declares a decimal number variable" },
  { label: "desimal var_name = 3.14", detail: "Float Init", desc: "Declares and initializes a float" },
  
  { label: "sulat var_name", detail: "String Declaration", desc: "Declares a string variable" },
  { label: "sulat var_name = \"text\"", detail: "String Init", desc: "Declares and initializes a string" },
  
  { label: "letra var_name", detail: "Char Declaration", desc: "Declares a character variable" },
  { label: "letra var_name = 'A'", detail: "Char Init", desc: "Declares and initializes a single character" },

  // Operations
  { label: "variable++", detail: "Increment", desc: "Increases value by 1" },
  { label: "variable--", detail: "Decrement", desc: "Decreases value by 1" },
  { label: "variable += 5", detail: "Add Assignment", desc: "Adds value to existing variable" },
];

export const DEFAULT_FILES = [
  { 
    name: "sample.wxd", 
    content: `// Variable Declarations
numero c = 10 + 10 * 2 
numero b = 2 * 10 + 10 
sulat g = "hello" 
desimal pi = 3.14
letra grade = 'A'

// Printing (No %d or %s needed anymore!)
ilimbag c 
ilimbag g 
ilimbag "Value of c:", c 
ilimbag "Greeting:", g 
ilimbag "Math Result:", b
ilimbag "Pi is:", pi, "Grade is:", grade

// Reassigning String
g = "yoooo" 
ilimbag "New string:", g 

// Math & Compound Assignments
c = c + 5
c += 10    // Add 10
c *= 2     // Multiply by 2
ilimbag "After math:", c

// Increment / Decrement
c++
++c
ilimbag "After increments:", c`, 
    active: true, 
    open: true 
  },
];