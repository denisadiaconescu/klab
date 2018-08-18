rule #take(N, #padToWidth(N, X) ++ Z ) => X
rule #asWord( #asByteStack( X ) ) => X

rule #hashedLocation("DappHub", BASE, OFFSET OFFSETS) => #hashedLocation("DappHub", keccakIntList(BASE OFFSET),       OFFSETS)

rule W0 s<Word W1 => #signed(W0) <Word #signed(W1)

rule #signed(#unsigned(W)) => W
  requires #rangeSInt(256, W)

rule #unsigned(#signed(W)) => W
  requires #rangeUInt(256, W)

// lemmas to tell us that our non-overflow conditions are sufficient
// n.b. how + cases use +Int because of earlier application of +Word
rule chop(#unsigned(A) +Int B) => #unsigned(A +Int B)
  requires #rangeSInt(256, A)
  andBool #rangeSInt(256, B)
  andBool #rangeSInt(256, A +Int B)

// rule chop(#unsigned(A) -Int B) => #unsigned(A -Int B)
//   requires #rangeSInt(256, A)
//   andBool #rangeSInt(256, B)
//   andBool #rangeSInt(256, A -Int B)

rule (#unsigned(A) -Word B) => #unsigned(A -Int B)
  requires #rangeSInt(256, A)
  andBool #rangeSInt(256, B)
  andBool #rangeSInt(256, A -Int B)

// #unsigned gets applied too early :( hence this:
rule #unsigned(A) -Word (pow256 +Int B) => chop(A -Int B +Int pow256)


