export class ProfileCompleteness {
  /**
   * Calculate profile completeness percentage
   */
  static calculateCompleteness(profile: any): number {
    const requiredFields = [
      "basicInfo.name",
      "basicInfo.age",
      "basicInfo.gender",
      "location.country",
      "location.city",
      "education.level",
      "professional.occupation",
      "religiousInfo.religiousLevel",
      "personalInfo.about"
    ];

    // Gender-specific required fields
    let genderSpecificFields: string[] = [];
    if (profile.basicInfo?.gender === "m") {
      genderSpecificFields = [
        "personalInfo.hasBeard",
        "financialInfo.situation"
      ];
    } else if (profile.basicInfo?.gender === "f") {
      genderSpecificFields = [
        "guardianInfo.name",
        "guardianInfo.phone",
        "personalInfo.wearHijab"
      ];
    }

    const allRequiredFields = [...requiredFields, ...genderSpecificFields];
    const completedFields = allRequiredFields.filter(field => {
      // Navigate through nested objects
      const parts = field.split(".");
      let current = profile;
      for (const part of parts) {
        if (current && current[part] != null) {
          current = current[part];
        } else {
          return false;
        }
      }
      return true;
    });

    return Math.round((completedFields.length / allRequiredFields.length) * 100);
  }

  /**
   * Get missing required fields for profile completion
   */
  static getMissingFields(profile: any): string[] {
    const requiredFields = [
      "basicInfo.name",
      "basicInfo.age",
      "basicInfo.gender",
      "location.country",
      "location.city",
      "education.level",
      "professional.occupation",
      "religiousInfo.religiousLevel",
      "personalInfo.about"
    ];

    // Gender-specific required fields
    let genderSpecificFields: string[] = [];
    if (profile.basicInfo?.gender === "m") {
      genderSpecificFields = [
        "personalInfo.hasBeard",
        "financialInfo.situation"
      ];
    } else if (profile.basicInfo?.gender === "f") {
      genderSpecificFields = [
        "guardianInfo.name",
        "guardianInfo.phone",
        "personalInfo.wearHijab"
      ];
    }

    const allRequiredFields = [...requiredFields, ...genderSpecificFields];
    const missingFields = allRequiredFields.filter(field => {
      // Navigate through nested objects
      const parts = field.split(".");
      let current = profile;
      for (const part of parts) {
        if (current && current[part] != null) {
          current = current[part];
        } else {
          return true; // Field is missing
        }
      }
      return false; // Field is present
    });

    return missingFields;
  }

  /**
   * Check if profile is complete enough (80% threshold)
   */
  static isProfileComplete(profile: any, threshold: number = 80): boolean {
    const completeness = this.calculateCompleteness(profile);
    return completeness >= threshold;
  }

  /**
   * Get completion status details
   */
  static getCompletionDetails(profile: any): any {
    const completeness = this.calculateCompleteness(profile);
    const missingFields = this.getMissingFields(profile);
    
    return {
      completeness,
      isComplete: this.isProfileComplete(profile),
      missingFields,
      completionMessage: this.getCompletionMessage(completeness)
    };
  }

  /**
   * Get completion message based on percentage
   */
  static getCompletionMessage(completeness: number): string {
    if (completeness >= 95) {
      return "ممتاز! ملفك الشخصي مكتمل تقريبًا";
    } else if (completeness >= 80) {
      return "جيد جدًا! ملفك الشخصي مكتمل بشكل جيد";
    } else if (completeness >= 60) {
      return "جيد! لكن يمكنك تحسين ملفك الشخصي أكثر";
    } else if (completeness >= 40) {
      return "مقبول، لكن يُنصح بإكمال ملفك الشخصي";
    } else {
      return "يجب إكمال ملفك الشخصي ليتمكن الآخرون من معرفتك بشكل أفضل";
    }
  }
}

export default ProfileCompleteness;