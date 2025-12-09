"use client";
import { useCallback, useReducer } from "react";
import { authApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";
import { AuthenticationError, ValidationError } from "@/lib/types/auth.types";
import { RegistrationData } from "@/lib/types";

// Registration State Management
interface RegistrationState {
  currentStep: number;
  totalSteps: number;
  data: RegistrationData;
  completedSteps: Set<number>;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: string[] | null; // Add support for multiple validation errors
  otpSent: boolean;
  profilePicture: File | null;
}

type RegistrationAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "UPDATE_DATA"; payload: Partial<RegistrationData> }
  | { type: "MARK_STEP_COMPLETED"; payload: number }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_VALIDATION_ERRORS"; payload: string[] | null }
  | { type: "SET_OTP_SENT"; payload: boolean }
  | { type: "SET_PROFILE_PICTURE"; payload: File | null }
  | { type: "RESET" };

const initialState: RegistrationState = {
  currentStep: 1,
  totalSteps: 3,
  data: {
    email: `test${Date.now()}@example.com`,
    password: "TestPass123",
    confirmPassword: "TestPass123",
    firstname: "أحمد",
    lastname: "محمد",
    age: 28,
    gender: "m",
    phone: "+966501234567",
    otpCode: "",
    country: "السعودية",
    city: "الرياض",
    nationality: "سعودي",
    maritalStatus: "single",
    religiousLevel: "practicing",
    isPrayerRegular: true,
    areParentsAlive: "both",
    parentRelationship: "good",
    wantsChildren: "yes",
    height: 175,
    weight: 75,
    appearance: "attractive",
    skinColor: "fair",
    bodyType: "average",
    interests: "القراءة، السفر، الرياضة",
    marriageGoals: "أسعى للزواج لتكوين أسرة المسلمة متماسكة",
    personalityDescription: "شخص هادئ ومتفهم، أحب الاستقرار والأسرة",
    familyPlans: "أتمنى إنجاب 2-3 أطفال وتربيتهم على القيم الإسلامية",
    relocationPlans: "مستعد للانتقال داخل المملكة",
    marriageTimeline: "خلال 6-12 شهر",
    preferences: {
      ageRange: { min: 22, max: 30 },
    },
    education: "bachelor",
    occupation: "مهندس",
    bio: "مهندس برمجيات، أحب القراءة والسفر، أسعى لتكوين أسرة مسلمة متماسكة",
    acceptDeclaration: true, // Required field
    // Male-specific (all required for males)
    hasBeard: false, // Required field
    isRegularAtMosque: true, // Required field
    smokes: false, // Required field
    prayingLocation: "البيت",
    financialSituation: "good",
    housingLocation: "الرياض",
    housingOwnership: "owned",
    housingType: "شقة",
    providerView: "أحب توفير احتياجات الأسرة",
    householdChores: "أساعد في الأعمال المنزلية",
    // Female-specific
    guardianName: "",
    guardianPhone: "",
    guardianRelationship: "father",
    wearHijab: "hijab",
    wearNiqab: false,
    clothingStyle: "",
    guardianEmail: "",
    guardianNotes: "",
    mahramAvailable: false,
    workAfterMarriage: "yes",
    childcarePreference: "",
  },
  completedSteps: new Set(),
  isSubmitting: false,
  error: null,
  validationErrors: null,
  otpSent: false,
  profilePicture: null,
};

function registrationReducer(
  state: RegistrationState,
  action: RegistrationAction,
): RegistrationState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload, error: null };
    case "UPDATE_DATA":
      return {
        ...state,
        data: { ...state.data, ...action.payload },
        error: null,
      };
    case "MARK_STEP_COMPLETED":
      return {
        ...state,
        completedSteps: new Set([...state.completedSteps, action.payload]),
      };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, validationErrors: null };
    case "SET_VALIDATION_ERRORS":
      return { ...state, validationErrors: action.payload, error: null };
    case "SET_OTP_SENT":
      return { ...state, otpSent: action.payload };
    case "SET_PROFILE_PICTURE":
      return { ...state, profilePicture: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface UseRegistrationResult {
  currentStep: number;
  totalSteps: number;
  data: RegistrationData;
  completedSteps: Set<number>;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: string[] | null;
  otpSent: boolean;
  profilePicture: File | null;
  goToStep: (step: number) => void;
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  updateData: (data: Partial<RegistrationData>) => void;
  setProfilePicture: (file: File | null) => void;
  sendOTP: () => Promise<boolean>;
  submitRegistration: () => Promise<boolean>;
  reset: () => void;
  clearError: () => void;
  validateCurrentStep: () => Promise<boolean>;
  isStepCompleted: (step: number) => boolean;
  canProceedToStep: (step: number) => boolean;
}

const useRegistration = (): UseRegistrationResult => {
  const [state, dispatch] = useReducer(registrationReducer, initialState);

  const handleError = useCallback((error: any) => {
    console.error("Registration error:", error);

    // Handle backend validation errors (array of error messages)
    if (
      error.response?.data?.error &&
      Array.isArray(error.response.data.error)
    ) {
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        payload: error.response.data.error,
      });
      showToast.error(
        error.response.data.message || "بيانات التسجيل غير صحيحة",
      );
      return;
    }

    if (error instanceof ValidationError) {
      // Check if we have validation errors array in fields.general
      if (error.fields?.["general"] && Array.isArray(error.fields["general"])) {
        dispatch({
          type: "SET_VALIDATION_ERRORS",
          payload: error.fields["general"],
        });
        showToast.error(error.message || "بيانات التسجيل غير صحيحة");
        return;
      }

      // Handle other field validation errors
      const firstFieldError = Object.values(error.fields || {})[0]?.[0];
      const errorMessage = firstFieldError || error.message;
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      showToast.error(errorMessage);
      return;
    }
    if (error instanceof AuthenticationError) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      showToast.error(error.message);
      return;
    }
    const errorMessage = error.message || "حدث خطأ غير متوقع";
    dispatch({ type: "SET_ERROR", payload: errorMessage });
    showToast.error(errorMessage);
  }, []);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      // Step 1: Validate basic auth fields
      if (state.currentStep === 1) {
        if (!state.data.email) {
          dispatch({ type: "SET_ERROR", payload: "البريد الإلكتروني مطلوب" });
          return false;
        }
        if (!state.data.password) {
          dispatch({ type: "SET_ERROR", payload: "كلمة المرور مطلوبة" });
          return false;
        }
        if (!state.data.gender) {
          dispatch({ type: "SET_ERROR", payload: "يرجى اختيار الجنس" });
          return false;
        }
        if (!state.data.firstname) {
          dispatch({ type: "SET_ERROR", payload: "الاسم الأول مطلوب" });
          return false;
        }
        if (!state.data.lastname) {
          dispatch({ type: "SET_ERROR", payload: "الاسم الأخير مطلوب" });
          return false;
        }

        // Email confirmation will happen after registration
        // No OTP required during registration process
      }

      // Step 2: Validate personal data - aligned with backend requirements
      if (state.currentStep === 2) {
        // Basic required fields validation
        if (!state.data.firstname?.trim()) {
          dispatch({ type: "SET_ERROR", payload: "الاسم الأول مطلوب" });
          return false;
        }
        if (!state.data.lastname?.trim()) {
          dispatch({ type: "SET_ERROR", payload: "الاسم الأخير مطلوب" });
          return false;
        }
        if (!state.data.age || state.data.age < 18 || state.data.age > 100) {
          dispatch({
            type: "SET_ERROR",
            payload: "العمر يجب أن يكون بين 18-100 سنة",
          });
          return false;
        }
        if (!state.data.nationality?.trim()) {
          dispatch({ type: "SET_ERROR", payload: "الجنسية مطلوبة" });
          return false;
        }
        if (!state.data.maritalStatus) {
          dispatch({ type: "SET_ERROR", payload: "الحالة الاجتماعية مطلوبة" });
          return false;
        }
        if (!state.data.country?.trim()) {
          dispatch({ type: "SET_ERROR", payload: "البلد مطلوب" });
          return false;
        }
        if (!state.data.city?.trim()) {
          dispatch({ type: "SET_ERROR", payload: "المدينة مطلوبة" });
          return false;
        }
        if (!state.data.religiousLevel) {
          dispatch({ type: "SET_ERROR", payload: "المستوى الديني مطلوب" });
          return false;
        }
        if (
          state.data.height === undefined ||
          state.data.height < 120 ||
          state.data.height > 220
        ) {
          dispatch({
            type: "SET_ERROR",
            payload: "الطول يجب أن يكون بين 120-220 سم",
          });
          return false;
        }
        if (
          state.data.weight === undefined ||
          state.data.weight < 30 ||
          state.data.weight > 200
        ) {
          dispatch({
            type: "SET_ERROR",
            payload: "الوزن يجب أن يكون بين 30-200 كجم",
          });
          return false;
        }
        if (!state.data.skinColor) {
          dispatch({ type: "SET_ERROR", payload: "لون البشرة مطلوب" });
          return false;
        }
        if (!state.data.bodyType) {
          dispatch({ type: "SET_ERROR", payload: "نوع الجسم مطلوب" });
          return false;
        }
        if (!state.data.appearance) {
          dispatch({ type: "SET_ERROR", payload: "المظهر العام مطلوب" });
          return false;
        }
        if (!state.data.areParentsAlive) {
          dispatch({ type: "SET_ERROR", payload: "حالة الوالدين مطلوبة" });
          return false;
        }
        if (!state.data.parentRelationship) {
          dispatch({
            type: "SET_ERROR",
            payload: "العلاقة مع الوالدين مطلوبة",
          });
          return false;
        }
        if (!state.data.wantsChildren) {
          dispatch({ type: "SET_ERROR", payload: "الرغبة في الأطفال مطلوبة" });
          return false;
        }
        if (!state.data.interests?.trim()) {
          dispatch({ type: "SET_ERROR", payload: "الاهتمامات مطلوبة" });
          return false;
        }
        if (!state.data.marriageGoals?.trim()) {
          dispatch({ type: "SET_ERROR", payload: "أهداف الزواج مطلوبة" });
          return false;
        }
        if (!state.data.personalityDescription?.trim()) {
          dispatch({ type: "SET_ERROR", payload: "وصف الشخصية مطلوب" });
          return false;
        }
        if (!state.data.familyPlans?.trim()) {
          dispatch({ type: "SET_ERROR", payload: "خطط العائلة مطلوبة" });
          return false;
        }
        if (!state.data.marriageTimeline?.trim()) {
          dispatch({
            type: "SET_ERROR",
            payload: "التوقيت المفضل للزواج مطلوب",
          });
          return false;
        }

        // Gender-specific validations
        if (state.data.gender === "m") {
          if (state.data.hasBeard === undefined) {
            dispatch({
              type: "SET_ERROR",
              payload: "حالة اللحية مطلوبة للذكور",
            });
            return false;
          }
          if (!state.data.financialSituation) {
            dispatch({
              type: "SET_ERROR",
              payload: "الوضع المالي مطلوب للذكور",
            });
            return false;
          }
          if (!state.data.housingOwnership) {
            dispatch({
              type: "SET_ERROR",
              payload: "ملكية السكن مطلوبة للذكور",
            });
            return false;
          }
          if (state.data.isRegularAtMosque === undefined) {
            dispatch({
              type: "SET_ERROR",
              payload: "حالة الصلاة في المسجد مطلوبة للذكور",
            });
            return false;
          }
          if (state.data.smokes === undefined) {
            dispatch({
              type: "SET_ERROR",
              payload: "حالة التدخين مطلوبة للذكور",
            });
            return false;
          }
        }

        if (state.data.gender === "f") {
          if (
            state.data.wearHijab === undefined ||
            state.data.wearHijab === null
          ) {
            dispatch({
              type: "SET_ERROR",
              payload: "حالة الحجاب مطلوبة للإناث",
            });
            return false;
          }
          if (!state.data.guardianName?.trim()) {
            dispatch({ type: "SET_ERROR", payload: "اسم الولي مطلوب للإناث" });
            return false;
          }
          if (!state.data.guardianPhone?.trim()) {
            dispatch({
              type: "SET_ERROR",
              payload: "رقم هاتف الولي مطلوب للإناث",
            });
            return false;
          }
          if (!state.data.guardianRelationship) {
            dispatch({
              type: "SET_ERROR",
              payload: "علاقة الولي مطلوبة للإناث",
            });
            return false;
          }
        }

        // Preferences validation
        if (
          !state.data.preferences?.ageRange?.min ||
          !state.data.preferences?.ageRange?.max
        ) {
          dispatch({
            type: "SET_ERROR",
            payload: "يرجى تحديد المدى العمري المفضل",
          });
          return false;
        }
      }

      // Step 3: Review, no additional validation
      dispatch({ type: "SET_ERROR", payload: null });
      return true;
    } catch (error: any) {
      handleError(error);
      return false;
    }
  }, [state.currentStep, state.data, state.otpSent, handleError]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= state.totalSteps) {
        dispatch({ type: "SET_STEP", payload: step });
      }
    },
    [state.totalSteps],
  );

  const nextStep = useCallback(async (): Promise<boolean> => {
    const isValid = await validateCurrentStep();
    if (!isValid) return false;

    dispatch({ type: "MARK_STEP_COMPLETED", payload: state.currentStep });

    if (state.currentStep < state.totalSteps) {
      const nextStepNumber = state.currentStep + 1;
      dispatch({ type: "SET_STEP", payload: nextStepNumber });
    }

    return true;
  }, [validateCurrentStep, state.currentStep, state.totalSteps]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 1) {
      const prevStepNumber = state.currentStep - 1;
      dispatch({ type: "SET_STEP", payload: prevStepNumber });
    }
  }, [state.currentStep]);

  const updateData = useCallback((data: Partial<RegistrationData>) => {
    dispatch({ type: "UPDATE_DATA", payload: data });
  }, []);

  const setProfilePicture = useCallback((file: File | null) => {
    dispatch({ type: "SET_PROFILE_PICTURE", payload: file });
  }, []);

  const sendOTP = useCallback(async (): Promise<boolean> => {
    try {
      dispatch({ type: "SET_SUBMITTING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      if (!state.data.email) {
        dispatch({ type: "SET_ERROR", payload: "البريد الإلكتروني مطلوب" });
        return false;
      }

      // Simulated OTP sending (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      dispatch({ type: "SET_OTP_SENT", payload: true });
      showToast.success("تم إرسال رمز التحقق");
      return true;
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }, [state.data.email, handleError]);

  const submitRegistration = useCallback(async (): Promise<boolean> => {
    try {
      dispatch({ type: "SET_SUBMITTING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // Validate form data
      const isValid = await validateCurrentStep();
      if (!isValid) {
        showToast.error("يرجى ملء جميع الحقول المطلوبة بشكل صحيح");
        return false;
      }

      // Transform RegistrationData to match the exact structure from TODO.md
      const regData = state.data; // Use the full registration data from state

      // Comprehensive validation before sending - aligned with backend validation
      const validationErrors: string[] = [];

      if (!regData.email) validationErrors.push("البريد الإلكتروني مطلوب");
      if (!regData.password) validationErrors.push("كلمة المرور مطلوبة");
      if (!regData.firstname) validationErrors.push("الاسم الأول مطلوب");
      if (!regData.lastname) validationErrors.push("الاسم الأخير مطلوب");
      if (!regData.gender) validationErrors.push("الجنس مطلوب");
      // Phone is optional during registration but if provided, must be valid
      if (regData.phone && !/^\+[1-9]\d{1,14}$/.test(regData.phone)) {
        validationErrors.push("رقم الهاتف غير صحيح");
      }
      if (!regData.country?.trim()) validationErrors.push("البلد مطلوب");
      if (!regData.city?.trim()) validationErrors.push("المدينة مطلوبة");
      if (!regData.nationality?.trim()) validationErrors.push("الجنسية مطلوبة");
      if (regData.acceptDeclaration !== true)
        validationErrors.push("يجب الموافقة على الإقرار والتعهد");

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (regData.email && !emailRegex.test(regData.email.trim())) {
        validationErrors.push("تنسيق البريد الإلكتروني غير صحيح");
      }

      // Validate password strength (backend requires uppercase, lowercase, digit)
      if (regData.password && regData.password.length < 8) {
        validationErrors.push("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      }
      if (
        regData.password &&
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(regData.password)
      ) {
        validationErrors.push(
          "كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم",
        );
      }

      // Validate password confirmation
      if (regData.password !== regData.confirmPassword) {
        validationErrors.push("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
      }

      // Validate age (backend requires 18-100)
      if (regData.age === undefined || regData.age < 18 || regData.age > 100) {
        validationErrors.push("العمر يجب أن يكون بين 18 و 100 سنة");
      }

      // Validate basicInfo.name (combined firstname and lastname)
      if (!regData.firstname?.trim() || !regData.lastname?.trim()) {
        validationErrors.push("الاسم الأول واسم العائلة مطلوبان");
      }

      // The location validation should not happen here since we're already checking these fields above
      // The location object will be built in the backendData format section below

      // Validate required text fields
      if (!regData.marriageGoals?.trim())
        validationErrors.push("أهداف الزواج مطلوبة");
      if (!regData.personalityDescription?.trim())
        validationErrors.push("وصف الشخصية مطلوبة");
      if (!regData.familyPlans?.trim())
        validationErrors.push("خطط العائلة مطلوبة");

      // Gender-specific validations based on backend requirements
      if (regData.gender === "f") {
        if (!regData.guardianName?.trim())
          validationErrors.push("اسم الولي مطلوب للإناث");
        if (!regData.guardianPhone?.trim())
          validationErrors.push("رقم هاتف الولي مطلوب للإناث");
        if (
          !regData.guardianRelationship ||
          !["father", "brother", "uncle", "other"].includes(
            regData.guardianRelationship,
          )
        )
          validationErrors.push("علاقة الولي غير صحيحة للإناث");
        if (regData.wearHijab === undefined || regData.wearHijab === null)
          validationErrors.push("حالة الحجاب مطلوبة للإناث");
        if (regData.wearNiqab === undefined)
          validationErrors.push("حالة النقاب مطلوبة للإناث");
      }

      if (regData.gender === "m") {
        if (regData.hasBeard === undefined)
          validationErrors.push("حالة اللحية مطلوبة للذكور");
        if (
          !regData.financialSituation ||
          !["excellent", "good", "average", "struggling"].includes(
            regData.financialSituation,
          )
        )
          validationErrors.push("الحالة المالية مطلوبة للذكور");
        if (
          !regData.housingOwnership ||
          !["owned", "rented", "family-owned"].includes(
            regData.housingOwnership,
          )
        )
          validationErrors.push("نوع السكن مطلوب للذكور");
      }

      if (validationErrors.length > 0) {
        dispatch({ type: "SET_VALIDATION_ERRORS", payload: validationErrors });
        showToast.error("يرجى تصحيح الأخطاء المذكورة");
        return false;
      }

      // Format data to match the exact structure expected by backend
      const backendData = {
        email: regData.email.trim(),
        password: regData.password,
        confirmPassword: regData.confirmPassword || regData.password, // Use confirmPassword if provided
        phone: regData.phone ? regData.phone.trim() : undefined,
        gender: regData.gender,
        acceptDeclaration: regData.acceptDeclaration || false,
        basicInfo: {
          name: `${regData.firstname.trim()} ${regData.lastname.trim()}`, // Combine names to single field
          age: regData.age,
          maritalStatus: regData.maritalStatus || "single",
          ...(regData.gender === "m" && {
            hasBeard: regData.hasBeard ?? false, // Default to false instead of true
            financialSituation:
              (regData.financialSituation as
                | "excellent"
                | "good"
                | "average"
                | "struggling") || "average",
            housingOwnership:
              (regData.housingOwnership as
                | "owned"
                | "rented"
                | "family-owned") || "family-owned",
          }), // Only include for males
          ...(regData.gender === "f" && {
            guardianName: regData.guardianName?.trim() || "",
            guardianPhone: regData.guardianPhone?.trim() || "",
            guardianRelationship: regData.guardianRelationship || "",
            guardianEmail: regData.guardianEmail?.trim() || "",
            wearHijab:
              regData.wearHijab === "hijab" || regData.wearHijab === "niqab",
            wearNiqab: regData.wearHijab === "niqab",
          }), // Include guardian info and hijab status for females
        },
        location: {
          country: regData.country?.trim() || "",
          city: regData.city?.trim() || "",
          nationality: regData.nationality?.trim() || "",
        },
        education: {
          education: regData.education?.trim() || "",
          occupation: regData.occupation?.trim() || "",
        },
        professional: {
          occupation: regData.occupation?.trim() || "",
        },
        religiousInfo: {
          religiousLevel: regData.religiousLevel || "basic",
          isPrayerRegular: regData.isPrayerRegular ?? false,
          areParentsAlive: regData.areParentsAlive || "both",
          parentRelationship: regData.parentRelationship || "excellent",
          wantsChildren: regData.wantsChildren || "yes",
          isRegularAtMosque: regData.isRegularAtMosque ?? false,
          smokes: regData.smokes ?? false,
        },
        personalInfo: {
          height: regData.height || 0,
          weight: regData.weight || 0,
          appearance: regData.appearance || "average",
          skinColor: regData.skinColor || "medium",
          bodyType: regData.bodyType || "average",
          interests: regData.interests
            ? regData.interests
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s)
            : [],
          marriageGoals: regData.marriageGoals?.trim() || "",
          personalityDescription: regData.personalityDescription?.trim() || "",
          familyPlans: regData.familyPlans?.trim() || "",
          relocationPlans: regData.relocationPlans?.trim() || "",
          marriageTimeline: regData.marriageTimeline?.trim() || "",
          ...(regData.gender === "f" && {
            clothingStyle: regData.clothingStyle || "",
            workAfterMarriage: regData.workAfterMarriage as
              | "yes"
              | "no"
              | "maybe",
          }),
        },
        familyInfo: {
          hasChildren: "no" as "yes" | "no",
          childrenCount: 0,
        },
        lifestyle: {
          smokingStatus: (regData.smokes ? "occasionally" : "never") as
            | "never"
            | "quit"
            | "occasionally"
            | "regularly",
        },
        preferences: {
          ageMin: regData.preferences?.ageRange?.min || 18,
          ageMax: regData.preferences?.ageRange?.max || 40,
          country: regData.country?.trim() || "",
          maritalStatus: [regData.maritalStatus || "single"],
        },
        privacy: {
          showProfilePicture: "everyone" as
            | "everyone"
            | "matches-only"
            | "none",
          showAge: true,
          showLocation: true,
          showOccupation: true,
          allowMessagesFrom: "everyone" as "everyone" | "matches-only" | "none",
          profileVisibility: (regData.gender === "f"
            ? "guardian-approved"
            : "everyone") as
            | "everyone"
            | "verified-only"
            | "premium-only"
            | "guardian-approved"
            | "matches-only",
          requireGuardianApproval: regData.gender === "f",
          showOnlineStatus: false,
          allowNearbySearch: true,
        },
      };

      // Convert to FormData for file upload support
      const formData = new FormData();

      // Add profile picture if exists
      if (state.profilePicture) {
        formData.append("profilePicture", state.profilePicture);
      }

      // Add all other fields as JSON string
      Object.keys(backendData).forEach((key) => {
        const value = (backendData as any)[key];
        if (value !== undefined) {
          formData.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : value,
          );
        }
      });

      // Send FormData to the API
      console.log("Submitting registration with FormData");
      const response = await authApi.register(formData as any);
      console.log("Registration response:", response);

      if (response.success) {
        // Store photo in localStorage as fallback if upload failed during registration
        if (state.profilePicture) {
          const reader = new FileReader();
          reader.onloadend = () => {
            localStorage.setItem(
              "pending_profile_photo",
              reader.result as string,
            );
            localStorage.setItem(
              "pending_profile_photo_name",
              state.profilePicture!.name,
            );
          };
          reader.readAsDataURL(state.profilePicture);
        }

        showToast.success(
          response.message ||
            "تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني للتأكيد",
        );
      } else {
        throw new Error(response.message || "فشل في إنشاء الحساب");
      }

      return true;
    } catch (error: any) {
      console.error("Registration submission error:", error);

      // Enhanced error handling
      let errorMessage = "حدث خطأ أثناء إنشاء الحساب";
      let backendValidationErrors: string[] = [];

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Handle validation errors from backend
      if (error.response?.data) {
        const responseData = error.response.data;
        if (responseData.error && Array.isArray(responseData.error)) {
          backendValidationErrors = responseData.error;
        }
        if (responseData.message) {
          errorMessage = responseData.message;
        }
      }
      // Handle network errors
      if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        errorMessage =
          "خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى";
      }

      // Handle timeout errors
      if (error.code === "ECONNABORTED") {
        errorMessage = "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى";
      }

      // Handle 400 status (bad request)
      if (error.response?.status === 400) {
        errorMessage =
          "بيانات التسجيل غير صالحة. يرجى التحقق من المعلومات المدخلة";
      }

      // Handle 409 status (conflict - user already exists)
      if (error.response?.status === 409) {
        errorMessage = "هذا البريد الإلكتروني أو رقم الهاتف مستخدم مسبقاً";
      }

      // Handle 422 status (validation error)
      if (error.response?.status === 422) {
        errorMessage = "فشل في التحقق من البيانات. يرجى تصحيح الأخطاء";
      }

      // Handle 500 status (server error)
      if (error.response?.status >= 500) {
        errorMessage = "خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً";
      }

      // Set errors in state
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      if (backendValidationErrors.length > 0) {
        dispatch({
          type: "SET_VALIDATION_ERRORS",
          payload: backendValidationErrors,
        });
      }

      // Show error toast
      showToast.error(errorMessage);

      return false;
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }, [state, validateCurrentStep, handleError]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_VALIDATION_ERRORS", payload: null });
  }, []);

  const isStepCompleted = useCallback(
    (step: number): boolean => {
      return state.completedSteps.has(step);
    },
    [state.completedSteps],
  );

  const canProceedToStep = useCallback(
    (step: number): boolean => {
      for (let i = 1; i < step; i++) {
        if (!state.completedSteps.has(i)) {
          return false;
        }
      }
      return true;
    },
    [state.completedSteps],
  );

  return {
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    data: state.data,
    completedSteps: state.completedSteps,
    isSubmitting: state.isSubmitting,
    error: state.error,
    validationErrors: state.validationErrors,
    otpSent: state.otpSent,
    profilePicture: state.profilePicture,
    goToStep,
    nextStep,
    prevStep,
    updateData,
    setProfilePicture,
    sendOTP,
    submitRegistration,
    reset,
    clearError,
    validateCurrentStep,
    isStepCompleted,
    canProceedToStep,
  };
};

export { useRegistration };
export default useRegistration;
