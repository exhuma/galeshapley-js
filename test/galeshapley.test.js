/*eslint-env jest */

import { MatchContainer, Matcher } from "../src/galeshapley";

test("emptyMatcher", () => {
  let matcher = new Matcher([], []);
  let result = matcher.getMatches();
  expect(result).toEqual([]);
});

test("emptyProfiles", () => {
  let matcher = new Matcher(
    [],
    [
      { want: "blue", have: "red" },
      { want: "green", have: "yellow" },
      { want: "black", have: "white" },
    ]
  );
  let result = matcher.getMatches();
  expect(result).toEqual([]);
});

test("emptyVacancies", () => {
  let matcher = new Matcher(
    [
      { want: "blue", have: "red" },
      { want: "green", have: "yellow" },
      { want: "black", have: "white" },
    ],
    []
  );
  let result = matcher.getMatches();
  expect(result).toEqual([]);
});

test("multimatch", () => {
  let prefers = (vacancy, currentProfile, newProfile) => {
    return currentProfile === null || vacancy.want === newProfile.have;
  };
  let matcher = new Matcher(
    [
      { name: "profile1", want: "red", have: "blue" },
      { name: "profile2", want: "yellow", have: "green" },
      { name: "profile3", want: "purple", have: "teal" },
    ],
    [
      { name: "vacancy1", want: "blue", have: "red" },
      { name: "vacancy2", want: "green", have: "yellow" },
      { name: "vacancy3", want: "black", have: "white" },
    ],
    prefers,
    10
  );
  let result = matcher.getMatches();
  let testableResult = result.map(([a, b]) => {
    return a.want == b.have && a.have == b.want;
  });
  expect(testableResult).toEqual([true, true]);
});

test("simpleMatch", () => {
  let prefers = (vacancy, currentProfile, newProfile) => {
    return currentProfile === null || vacancy.want === newProfile.have;
  };
  let matcher = new Matcher(
    [{ name: "profile1", want: "red", have: "blue" }],
    [{ name: "vacancy1", want: "blue", have: "red" }],
    prefers
  );
  let result = matcher.getMatches().sort();
  expect(result.length).toBe(1);
  let expected = [
    { name: "vacancy1", want: "blue", have: "red" },
    { name: "profile1", want: "red", have: "blue" },
  ];
  expect(result[0]).toEqual(expected);
});

test("matcherSequence", () => {
  let matcher = new MatchContainer(null, [1, 2, 3]);
  let nextCandidate = matcher.nextCandidate();
  expect(nextCandidate).toBe(0);
  nextCandidate = matcher.nextCandidate();
  expect(nextCandidate).toBe(1);
  nextCandidate = matcher.nextCandidate();
  expect(nextCandidate).toBe(2);
  nextCandidate = matcher.nextCandidate();
  expect(nextCandidate).toBe(-1);
});
