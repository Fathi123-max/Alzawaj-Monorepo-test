export class CompatibilityCalculator {
  /**
   * Calculate compatibility score between two profiles
   */
  static calculateCompatibility(
    profile1: any,
    profile2: any
  ): { score: number; factors: any[] } {
    let score = 0;
    const factors: any[] = [];

    // Age compatibility (20 points)
    const age1 = profile1.basicInfo?.age || 0;
    const age2 = profile2.basicInfo?.age || 0;
    const ageDiff = Math.abs(age1 - age2);
    const ageScore = Math.max(0, 20 - ageDiff);
    score += ageScore;
    factors.push({
      factor: "age",
      weight: 20,
      match: ageDiff <= 5,
      details: { age1, age2, difference: ageDiff }
    });

    // Education level (15 points)
    const education1 = profile1.education?.level;
    const education2 = profile2.education?.level;
    if (education1 && education2 && education1 === education2) {
      score += 15;
      factors.push({
        factor: "education",
        weight: 15,
        match: true,
        details: { education1, education2 }
      });
    } else {
      factors.push({
        factor: "education",
        weight: 15,
        match: false,
        details: { education1, education2 }
      });
    }

    // Location (15 points)
    const location1 = profile1.location;
    const location2 = profile2.location;
    if (location1 && location2) {
      if (location1.city === location2.city) {
        score += 15;
        factors.push({
          factor: "location",
          weight: 15,
          match: true,
          details: { city1: location1.city, city2: location2.city }
        });
      } else if (location1.state === location2.state) {
        score += 7;
        factors.push({
          factor: "location",
          weight: 15,
          match: false,
          details: { state1: location1.state, state2: location2.state }
        });
      } else {
        factors.push({
          factor: "location",
          weight: 15,
          match: false,
          details: { location1, location2 }
        });
      }
    }

    // Religious commitment (20 points)
    const religious1 = profile1.religiousInfo?.religiousLevel;
    const religious2 = profile2.religiousInfo?.religiousLevel;
    if (religious1 && religious2 && religious1 === religious2) {
      score += 20;
      factors.push({
        factor: "religious_commitment",
        weight: 20,
        match: true,
        details: { religious1, religious2 }
      });
    } else {
      factors.push({
        factor: "religious_commitment",
        weight: 20,
        match: false,
        details: { religious1, religious2 }
      });
    }

    // Marriage type preference (10 points)
    const marriageType1 = profile1.preferences?.marriageType;
    const marriageType2 = profile2.preferences?.marriageType;
    if (marriageType1 && marriageType2 && marriageType1 === marriageType2) {
      score += 10;
      factors.push({
        factor: "marriage_type",
        weight: 10,
        match: true,
        details: { marriageType1, marriageType2 }
      });
    } else {
      factors.push({
        factor: "marriage_type",
        weight: 10,
        match: false,
        details: { marriageType1, marriageType2 }
      });
    }

    // Family planning (10 points)
    const children1 = profile1.preferences?.children;
    const children2 = profile2.preferences?.children;
    if (children1 && children2 && children1 === children2) {
      score += 10;
      factors.push({
        factor: "children",
        weight: 10,
        match: true,
        details: { children1, children2 }
      });
    } else {
      factors.push({
        factor: "children",
        weight: 10,
        match: false,
        details: { children1, children2 }
      });
    }

    // Employment status (10 points)
    const job1 = profile1.professional?.currentJob;
    const job2 = profile2.professional?.currentJob;
    if (job1 && job2) {
      score += 10;
      factors.push({
        factor: "employment",
        weight: 10,
        match: true,
        details: { job1, job2 }
      });
    } else {
      factors.push({
        factor: "employment",
        weight: 10,
        match: false,
        details: { job1, job2 }
      });
    }

    return {
      score: Math.min(100, score),
      factors
    };
  }

  /**
   * Get compatibility details between two profiles
   */
  static getCompatibilityDetails(
    profile1: any,
    profile2: any
  ): any {
    const { score, factors } = this.calculateCompatibility(profile1, profile2);
    
    // Categorize factors
    const matchingFactors = factors.filter(f => f.match);
    const nonMatchingFactors = factors.filter(f => !f.match);
    
    // Calculate category scores
    const categoryScores: any = {};
    factors.forEach(factor => {
      if (!categoryScores[factor.factor]) {
        categoryScores[factor.factor] = {
          totalWeight: 0,
          earnedPoints: 0,
          factors: []
        };
      }
      
      categoryScores[factor.factor].totalWeight += factor.weight;
      if (factor.match) {
        categoryScores[factor.factor].earnedPoints += factor.weight;
      }
      categoryScores[factor.factor].factors.push(factor);
    });
    
    return {
      overallScore: score,
      matchingFactors,
      nonMatchingFactors,
      categoryScores,
      details: factors
    };
  }
}

export default CompatibilityCalculator;