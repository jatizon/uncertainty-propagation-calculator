# Uncertainty Propagation Calculator

A small web tool for **propagation of uncertainty (POU)** in expressions: you enter a formula and your measured variables (value ± uncertainty), and it computes the result and its combined uncertainty. No more doing derivatives by hand.

**Live app:** [https://josalbertotizon.github.io/uncertainty-propagation-calculator/](https://josalbertotizon.github.io/uncertainty-propagation-calculator/)

---

## How to use it

1. **Expression**  
   Type your formula in the expression field. Use the same variable names you'll define below.

2. **Variables**  
   For each quantity you measure, fill in:
   - **Name** – symbol used in the expression (e.g. `x`, `m`, `T`)
   - **Value** – measured value (number)
   - **Error** – uncertainty (e.g. standard deviation or half of the smallest division)

3. **Calculate**  
   Click **Calculate**. The result is shown as **value ± uncertainty**, rounded so the uncertainty has one or two significant figures and the value matches.

**Example:**  
Expression: `m * 9.8 * h`  
Variables: `m = 2.5`, error `0.1`; `h = 1.20`, error `0.05`  
→ You get the computed value of `m·g·h` and the propagated uncertainty.

### Expression syntax

- **Operators:** `+`, `-`, `*`, `/`
- **Parentheses:** `( ... )` for grouping
- **Functions:** `exp(...)`, `ln(...)`, `log(...)`, `sin(...)`, `cos(...)`, `tan(...)`
- **Variables:** any alphanumeric name (e.g. `x`, `mass`, `T1`)

---

## How it's implemented

The core is a **binary expression tree** plus numerical differentiation to get partial derivatives. Everything runs in the browser (no server).

### 1. Expression tree (AST)

Expressions are parsed into a **binary tree** of nodes (`math.js`):

- **Leaves:** numbers or variable names.
- **Internal nodes:** one of `+`, `-`, `*`, `/`, with a left and right child.
- **Functions** (e.g. `exp`, `sin`) are represented as a node whose left child carries the function type and (recursively) the argument sub-expression; the right child is unused for that part of the tree.

So for example `a + b * c` becomes a tree with `+` at the root, `a` on the left, and a `*` node on the right with children `b` and `c`. Operator precedence is encoded in the tree shape: lower precedence (e.g. `+`, `-`) ends up higher in the tree, higher precedence (`*`, `/`) lower.

### 2. Parsing

- **`parseInputString(expr)`** – stores the expression string and resets a global position.
- **`readExpression(node)`** – recursive descent parser that:
  - Skips spaces.
  - Handles a leading function or parenthesis on the left child, then either a number/variable or a nested `readExpression`.
  - Reads one binary operator.
  - Does the same for the right child.
  - If there are more operators (e.g. `a + b + c` or `a + b * c`), it keeps extending the tree: same precedence (e.g. another `+`) becomes a new root; higher precedence (`*`, `/`) is attached as the new right child of the current node so that `*` and `/` are evaluated before the surrounding `+`/`-`.

So the tree is built in one pass, with precedence and associativity reflected in the structure.

### 3. Evaluation and substitution

- **`substituteVariable(node, names, values)`** – walks the tree and replaces every leaf that is a variable with the corresponding numeric value.
- **`computeExpression(node)`** – evaluates the tree with a **post-order traversal**: recurse on left child, recurse on right child, then apply the node's operator (or function) to the two results. That gives the numeric value of the expression.

### 4. Uncertainty (POU)

For a result \( f(x_1,\ldots,x_n) \) and uncertainties \( \sigma_i \) on each \( x_i \), the calculator uses the usual first-order formula:

\[
\sigma_f = \sqrt{\sum_i \left( \frac{\partial f}{\partial x_i} \right)^2 \sigma_i^2}.
\]

- **Partial derivatives** are computed **numerically**: for each variable \( x_i \), the code perturbs it by a tiny amount \( h \) (on the order of \( \sqrt{\texttt{Number.EPSILON}} \)), evaluates \( f \) twice (e.g. at \( x_i + h \) and \( x_i - h \)), and uses a central difference to approximate \( \partial f / \partial x_i \). So you don't need symbolic derivatives; the same tree used for evaluation is reused for POU.
- **`propagateUncertainty(node, variableNames, values, errors)`** – for each variable, (re)substitutes all values, computes \( \partial f / \partial x_i \) via that finite-difference, then sums \( (\partial f / \partial x_i)^2 \sigma_i^2 \) and returns \( \sqrt{\text{sum}} \).

### 5. Rounding and display

- **`approximateResult(value, error)`** – rounds the error to one or two significant figures and rounds the value to the same decimal place, so the result is displayed in the usual "value ± error" form.

---

## Run it locally

Serve the project over HTTP (e.g. from the repo root) so that `main.js` can load `math.js` as a module. For example:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve
```

Then open `http://localhost:8000` (or the port shown) and use `index.html`.

---

## License

See [LICENSE.md](LICENSE.md).  
Copyright © 2024 José Tizon.
