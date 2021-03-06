const clc = require('cli-color');
// const { formatStep } = require("./formatter.js");
const { formatMemory } = require("./unwrapper.js");
const C = require("./constraints.js");
const S = require("./state.js");
const Rule = require("./rule.js");
const kast = require("./kast.js");
// const Constraint = require("./constraints.js")
const format = require("./format.js")
const { genBehaviour } = require("./behavior.js");
const evmv = require("./evmv.js");
const fs = require("fs");
const {
  getCodeStringFromPc,
} = require("../lib/srchandler.js");
const {
  buildDisplayInfo
} = require("../lib/compile.js");

const hide_color = 244;
const show_color = 255;


const view = {
  constraint: {
    view: (state) => {
      let c1 = S
        .const(state)
        .split("\n")
        .map(c => c.trim())
      let initt_c = state.initt.split("_")[1];

      let cs = state.nodes[initt_c]
        .term.args.map(c => c.token);
      let c2 = C.clean(cs)
        // .const(state.initt)
        // .split("\n")
        // .map(c => c.trim())
      let str = c1
        .map(c => c2.indexOf(c) == -1
          ? c
          : clc.xterm(244)(c)
        )
        .join("\n")
      return str;

    },
  },
  // TODO - evm specific
  evm: {
    view: evmv
  },
  sourcemap: {
    view: state => {
      // SOURCECODE
      let id = S.term_id(state)
      let k = state.nodes[id].term;
      const {
        pc,
        call_id
      } = buildDisplayInfo(k, state.config);
      let spec_o = state.config.out[state.config.name.slice(6, -2)]
      let contract_o = state.config.implementations[spec_o.v2n[call_id]];
      let contract = state.config.contracts[contract_o.name];
      let src = getCodeStringFromPc(state.config.srcs, contract, parseInt(pc), true);
      return src;
    }
  },
  rule: {
    view: (state) => {
      let id = state.path[state.path.length - 1].step.rule;
      let rule = state.nodes[id] && JSON.stringify(state.nodes[id].term.att, false, 2) || "";
      return rule;
    },
  },
  behaviour: {
    view: (state) => {
      const styles = node => !node && 22
        || node.branching && 215
        || node.in_history && show_color // 77
        || node.active && 244
        || 234

      const behaviour = genBehaviour(state);
      const table = format.foldPreorder({
        tree: behaviour,
        loc: "head",
        styles
      })
      return "  " + format
        .formatDb(table, ["head", "deltaC"], styles)
        .split("\n")
        .join("\n  ")
    },
  },
  debug: {
    view: (state) => {
      let id = state.path[state.path.length - 1].step.to.split("_")[0]
      let k = state.nodes[id].term;
      let debug = (state.debug_show || [])
        .reduce((a, key) => ({...a, [key]: kast.get(k, key)}), {})
      return "pid:    " + state.config.proofid
        + "\nid:     " + id
        + "\ntarget: " + state.targett
        + "\noutput: " + JSON.stringify(kast.get(k, "ethereum.evm.output"))
        + "\n" + JSON.stringify(debug, false, 2);
    },
  },
  memory: {
    view: (state) => {
      let id = state.path[state.path.length - 1].step.to.split("_")[0]
      let k = state.nodes[id].term;
      let mem = kast.get(k, "ethereum.evm.callState.localMem")
      return JSON.stringify(mem.args.map(l => kast.format(l.args[0]) + " " + kast.format(l.args[1])), false, 2)
      // return memory_string.split("\n").map(s => s.trim()).join("\n");
      // let formatted_memory = formatMemory(memory_string);
      // return formatted_memory;
    },
  },
  z3feedback: {
    view: (state) => {
      let nodeid = S.id(state);
      // return JSON.stringify(state.z3feedback[nodeid] || {}, false, 2)
      if (! (nodeid in state.z3feedback)) return "";
      let rs = state.z3feedback[nodeid]
        .filter(msg => msg.rule !== "NORULE")
        .reduce((a, r) => ({
          ...a,
          [r.rule]: [...(a[r.rule] || []), r]
        }), {})

      let str = Object.keys(rs)
        .map(ruleid => {
          let z3s = rs[ruleid];
          if(ruleid in state.rules) {
            // todo parsing is server
            // let rO = Rule.parseRule(state.nodes[ruleid].term.att);
            // return ruleid
            //   + " "
            //   + (ruleid in state.rules)
            //   + " "
            //   + JSON.stringify(state.rules[ruleid], false, 2)

            return Rule.formatRule(state.rules[ruleid])
              + "\n"
              + z3s.map(({query, implication, result}) => {
                let resultStr = result in state.nodes
                  && state.nodes[result].term.token
                  || "";
                let imp_str = implication.split("_")[1] in state.nodes
                  && C.clean(kast.format( state.nodes[implication.split("_")[1]].term ).split("\n"))
                  || "";
                return ` ${query} ${imp_str} ${resultStr}`;
              }).join("\n")
          }
          return "";
        }).join("\n\n")
        str += "\n\n" + state.z3feedback[nodeid]
        .filter(msg => msg.rule == "NORULE" || msg.rule == "IMPLIESTARGET")
        .map(({query, implication, result}) => {
          let resultStr = result in state.nodes
            && state.nodes[result].term.token
            || "";
          let imp_str = implication.split("_")[1] in state.nodes
            && C.clean(kast.format( state.nodes[implication.split("_")[1]].term ).split("\n"))
            || "";
          return ` ${query} ${imp_str} ${resultStr}`;
        })
        .join("\n")

          // rule + " " +
          // query + " " +
          // (result in state.nodes && state.nodes[result].term.token || "" ))
          //
          //
          //
        // .map(id => (state.z3feedbackdata || {})[id] || "")
        // .filter(o => !!o)
        // .map(o => {
        //   let rhs        = kast.formatConstraint(o.rhs)
        //   let z3QueryId  = o.queryId
        //   let z3Result   = o.result.term.token
        //   return "result: " + clc.xterm(210)(z3Result)   + "\n"
        //    + "checking:"                             + "\n"
        //    + "    " + rhs + "\n";
        // })
        // .join("\n")
        // return z3feedback;
      return str;
    },
  },
  kcell: {
    view: state => {
      let id = S.term_id(state)
      let k = state.nodes[id].term;
      let kcell = kast.get(k, "k")
      return JSON.stringify(kcell, false, 2)
        // .split("~>")
        // .join("\n~>")
    },
  },
  help: {
    view: state => {
      return "TODO";
    },
  },
  log: {
    view: state => {
      return state.error || ""
    },
  }
}

module.exports = view
