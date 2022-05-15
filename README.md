# Gale-Shapely in JavaScript

This module provides a generic implementation for the Gale-Shapely matching algorithm.

This algorithm is used to find matches between two sets of objects, where one set of object "provides" certain qualities and the other set of objects "requires" a certain set of quality.

The original algorithm uses the "bride and groom" analogy, where each groom in a list of grooms proposes to each bride in a list of brides. The bride can then decide whether she prefers this proposal to an existing one.

In this particular implementation, the terms *bride* and *groom* have been replaced by *vacancy* and *profile* respectively to be more generic.

The algorithm is agnostic to the nature of both objects, and both objects can have differing attributes. The comparison operator (the function used by the "vacancy" to accept or reject a "profile" proposal) is provided as injection.

## Usage

```
import {Matcher} from "@exhuma/galeshapley";
let vacancies = [{wants: 10}, {wants: 20}]
let profiles = [{has: 20}, {has: 30}]
function prefers(vacancy, currentMatch, proposedMatch) {
    return currentMatch === null || vacancy.wants == proposedMatch.has
}
let matcher = new Matcher(vacancies, profiles, prefers)
matcher.getMatches.forEach((left, right) => {
    console.log({left, right})
})
```

The above code will print out:

```
{left: {wants: 20}, right: {has: 20}}
```