export class ModerationHelper {
  // Arabic abusive words list (simplified for example)
  static arabicAbusiveWords = [
    "كلب", "حمار", "عاهرة", "زانية", "لعين", "لعنة", " damned", " whore", " bitch"
  ];

  // English abusive words list (simplified for example)
  static englishAbusiveWords = [
    "damn", "hell", "whore", "bitch", "asshole", "bastard", "idiot", "stupid"
  ];

  /**
   * Check if content contains abusive words
   */
  static checkForAbusiveContent(content: string): {
    isAppropriate: boolean;
    flaggedWords: string[];
    moderationScore: number;
  } {
    const flaggedWords: string[] = [];
    let moderationScore = 0;

    // Check Arabic words
    this.arabicAbusiveWords.forEach(word => {
      if (content.includes(word)) {
        flaggedWords.push(word);
      }
    });

    // Check English words
    this.englishAbusiveWords.forEach(word => {
      if (content.toLowerCase().includes(word.toLowerCase())) {
        flaggedWords.push(word);
      }
    });

    // Calculate moderation score (0-1, where 1 is highly inappropriate)
    moderationScore = Math.min(1, flaggedWords.length / 10);

    return {
      isAppropriate: flaggedWords.length === 0,
      flaggedWords,
      moderationScore
    };
  }

  /**
   * Check if profile content is appropriate
   */
  static checkProfileContent(profile: any): {
    isAppropriate: boolean;
    flaggedFields: string[];
    moderationScore: number;
  } {
    const flaggedFields: string[] = [];
    let totalFlags = 0;

    // Check name
    if (profile.basicInfo?.name) {
      const nameCheck = this.checkForAbusiveContent(profile.basicInfo.name);
      if (!nameCheck.isAppropriate) {
        flaggedFields.push("name");
        totalFlags += nameCheck.flaggedWords.length;
      }
    }

    // Check about section
    if (profile.personalInfo?.about) {
      const aboutCheck = this.checkForAbusiveContent(profile.personalInfo.about);
      if (!aboutCheck.isAppropriate) {
        flaggedFields.push("about");
        totalFlags += aboutCheck.flaggedWords.length;
      }
    }

    // Check marriage goals
    if (profile.personalInfo?.marriageGoals) {
      const goalsCheck = this.checkForAbusiveContent(profile.personalInfo.marriageGoals);
      if (!goalsCheck.isAppropriate) {
        flaggedFields.push("marriageGoals");
        totalFlags += goalsCheck.flaggedWords.length;
      }
    }

    // Calculate moderation score
    const moderationScore = Math.min(1, totalFlags / 20);

    return {
      isAppropriate: flaggedFields.length === 0,
      flaggedFields,
      moderationScore
    };
  }

  /**
   * Check if message content is appropriate
   */
  static checkMessageContent(message: string): {
    isAppropriate: boolean;
    flaggedWords: string[];
    moderationScore: number;
  } {
    return this.checkForAbusiveContent(message);
  }

  /**
   * Generate moderation report
   */
  static generateModerationReport(content: any, type: string): any {
    let moderationResult: any;

    switch (type) {
      case "profile":
        moderationResult = this.checkProfileContent(content);
        break;
      case "message":
        moderationResult = this.checkMessageContent(content);
        break;
      default:
        moderationResult = this.checkForAbusiveContent(
          typeof content === "string" ? content : JSON.stringify(content)
        );
    }

    return {
      ...moderationResult,
      contentType: type,
      checkedAt: new Date(),
      needsReview: !moderationResult.isAppropriate || moderationResult.moderationScore > 0.5
    };
  }
}

export default ModerationHelper;