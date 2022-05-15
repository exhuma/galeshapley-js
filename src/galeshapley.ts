/**
 * This module contains an implementation of the Gale-Shapley algorithm.
 *
 * It generalises the terms "bride" and "groom" by using "vacancies" and
 * "profiles" respectively. As with the "brides" in the Gale-Shapley Algorithm,
 * "vacancies" take the decision about preferences. In this algorithm this
 * decision is provided via the injected `vacancyPrefersProfile` function in the
 * `Matcher` class.
 *
 * The `MatchContainer` class is an internal utility which is only exported for
 * use in unit-tests.
 *
 * Basic usage:
 *
 * - Create an instance of `Matcher` with both profiles and vacancies, and a
 *   "preference" function
 * - The preference function will get a vacancy as first argument, a "current
 *   match profile" (possibly `null`) as second and a new match profile as third
 *   and must return `true` if the vacancy prefers that profile to the current
 *   match, `false` otherwise.
 * - Call the `matched()` function on the matcher instance. This will return a
 *   list of 2-tuples representing the matched pairs.
 */

/**
 * An internal utility class which is used to wrap the real objects that were
 * passed into the matcher.
 *
 * This wrapping allows us to keep the required state for the algorithm without
 * modifying the original objects. Which in turn makes the implemented matcher
 * agnostic to object details.
 */
export class MatchContainer<Type> {

  obj: Type
  match: number | null
  currentCandidate: number
  candidates: Type[]

  /**
   * @constructor
   * @param {Type} obj The object to wrap
   * @param {Type[]} candidates The possible candidates that can be matched with `obj`
   */
  constructor(obj: Type, candidates: Type[]) {
    this.obj = obj;
    this.match = null;
    this.currentCandidate = 0;
    this.candidates = candidates;
  }

  /**
   * Determine the next index to process. Return -1 if we have processed all
   * available candidates.
   * @returns the index of the next candidate, -1 if we reached the end
   */
  nextCandidate() {
    if (this.currentCandidate >= this.candidates.length) {
      return -1;
    }
    // let output = this.candidates[this.currentCandidate];
    let output = this.currentCandidate;
    this.currentCandidate += 1;
    return output;
  }
}

/**
 * The main implementation of the Gale-Shapley algorithm.
 */
export class Matcher<Type> {
  wrappedProfiles: MatchContainer<Type>[];
  wrappedVacancies: MatchContainer<Type>[];
  vacancyPrefersProfile: (vacancy: Type, currentMatch: Type | null, newMatch: Type) => boolean
  maxLoopCount: number
  done: boolean = false

  /**
   * @constructor
   * @param {Type[]} profiles A list of profiles ("grooms" in the Gale-Shapley algorithm)
   * @param {Type[]} vacancies A list of vacancies ("brides" in the Gale-Shapley algorithm)
   * @param {*} vacancyPrefersProfile A function which is used to determine if a
   * vacancy ("bride") prefers a profile ("groom") to the current one.
   * @param {number} maxLoopCount A safety net to prevent endless loops. A the
   * `vacancyPrefersProfile` function is injected from the outside this
   * implementation cannot guaranteee to halt (in the case of a faulty
   * implementation of that fallback). This safety-net gives a convenient way to
   * bail out in such cases. Especially during development. Set it to 0 to
   * disable the safety-net, which can be useful if the size of the
   * profiles/vacancies is unknown.
   */
  constructor(profiles: Type[], vacancies: Type[], vacancyPrefersProfile: (vacancy: Type, currentMatch: Type | null, newMatch: Type) => boolean, maxLoopCount = 0) {
    this.wrappedProfiles = profiles.map(
      (item) => new MatchContainer(item, vacancies)
    );
    this.wrappedVacancies = vacancies.map(
      (item) => new MatchContainer(item, profiles)
    );
    this.vacancyPrefersProfile = vacancyPrefersProfile;
    this.maxLoopCount = maxLoopCount;
    this.done = false;
  }

  /**
   * Run the matching algorithm.
   */
  match() {
    // The "preferred" function is an external injection so we have no guarantee
    // that this loop will ever stop. To prevent endless loops cuase by this, we
    // add an upper-bound to loops. This will allow us to raise more helpful
    // errors.
    let loopCount = 0;
    while (
      !this.done &&
      (this.maxLoopCount <= 0 || loopCount < this.maxLoopCount)
    ) {
      this.done = true;
      this.wrappedProfiles.forEach((wrappedProfile, profileIndex) => {
        let candidateVacancyIndex = wrappedProfile.nextCandidate();
        if (candidateVacancyIndex == -1) {
          return;
        }
        let candidateVacancy = this.wrappedVacancies[candidateVacancyIndex];
        let currentMatch =
          candidateVacancy.match === null
            ? null
            : this.wrappedProfiles[candidateVacancy.match];
        if (candidateVacancy.match === null) {
          this.done = false;
        }
        if (candidateVacancy.match === null && wrappedProfile.match === null) {
          candidateVacancy.match = profileIndex;
          wrappedProfile.match = candidateVacancyIndex;
        } else if (
          currentMatch !== null &&
          this.vacancyPrefersProfile(
            candidateVacancy.obj,
            currentMatch.obj,
            wrappedProfile.obj
          )
        ) {
          this.done = false;
          if (candidateVacancy.match !== null) {
            this.wrappedProfiles[candidateVacancy.match].match = null;
          }
          candidateVacancy.match = profileIndex;
          wrappedProfile.match = candidateVacancyIndex;
        }
      });
      loopCount += 1;
    }
    if (!this.done) {
      throw new Error("Max loop count reached (infinite loop?)");
    }
    this.evictUnmatching();
  }

  /**
   * The algorithm creates "optimistic" matches by matching a profile with a
   * vacancy even if they don't match according to their preference.
   *
   * This method loops over the established matches and removes those where the
   * preference function returns `false`
   */
  evictUnmatching() {
    this.wrappedVacancies.map((vacancy) => {
      if (vacancy.match === null) {
        return;
      }
      let matchedProfile = this.wrappedProfiles[vacancy.match];
      let currentMatch =
        vacancy.match === null ? null : this.wrappedProfiles[vacancy.match].obj;
      if (
        !this.vacancyPrefersProfile(
          vacancy.obj,
          currentMatch,
          matchedProfile.obj
        )
      ) {
        vacancy.match = null;
        matchedProfile.match = null;
      }
    });
  }

  /**
   * Return the matches (and implicitly run the matcher if it has not yet been triggered).
   * @returns A list of `[vacancy, profile]` pairs representing the established matches.
   */
  getMatches() {
    if (!this.done) {
      this.match();
    }
    let output: Array<[Type, Type]>  = [];
    this.wrappedVacancies.map((vacancy) => {
      if (vacancy.match !== null) {
        output.push([vacancy.obj, this.wrappedProfiles[vacancy.match].obj]);
      }
    });
    return output;
  }
}
