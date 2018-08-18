pragma solidity ^0.4.23;
interface D0 {
  function suck(address,int256) external;
}

contract D0Impl {
  constructor () public {
    assembly {
      sstore(0, caller)
    }
  }
  function () public {
    assembly {
      let sig := div(calldataload(0), 0x100000000000000000000000000000000000000000000000000000000)
      if eq(sig, 0x0af9d5e0 /* suck(address,int256) */) {
        /*
          reverts iff
          || !sub_safe(V, delta_D)
          || V - delta_D < 0
        */
        
        /* let V_ = V - delta_D */
        let V_ := isub(sload(11), calldataload(36))
        
        /* iff V_ >= 0 */
        if slt(V_, 0) { revert(0, 0) }
        
        /* set V = V_ */
        sstore(11, V_)

        stop()
      }
      
      revert(0, 0)
      
      function hash2(b, i) -> h {
        mstore(0, b)
        mstore(32, i)
        h := keccak256(0, 64)
      }
      function iadd(x, y) -> z {
        z := add(x, y)
        // revert if y > 0 and z <= x
        if sgt(y, 0) { if iszero(sgt(z, x)) { revert(0, 0) } }
        // revert if y < 0 and z >= x
        if slt(y, 0) { if iszero(slt(z, x)) { revert(0, 0) } }
      }
      function isub(x, y) -> z {
        z := sub(x, y)
        // revert if y < 0 and z <= x
        if slt(y, 0) { if iszero(sgt(z, x)) { revert(0, 0) } }
        // revert of y > 0 and z >= x
        if sgt(y, 0) { if iszero(slt(z, x)) { revert(0, 0) } }
      }
    }
  }
}
