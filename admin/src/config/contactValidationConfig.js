/**
 * Validation configuration for contact/restaurant information
 * Edit these values to change validation requirements
 */

export const CONTACT_VALIDATION_CONFIG = {
  contactInfo: {
    street: {
      required: true,
      minLength: 5,
      maxLength: 200,
      errorMessages: {
        required: 'La calle es requerida',
        minLength: 'La calle debe tener al menos {minLength} caracteres',
        maxLength: 'La calle no puede tener más de {maxLength} caracteres'
      }
    },
    postalCode: {
      required: true,
      minLength: 5,
      errorMessages: {
        required: 'El código postal es requerido',
        invalid: 'El código postal debe tener 5 dígitos',
        minLength: 'El código postal debe tener {minLength} dígitos'
      }
    },
    city: {
      required: true,
      minLength: 2,
      maxLength: 100,
      errorMessages: {
        required: 'La ciudad es requerida',
        minLength: 'La ciudad debe tener al menos {minLength} caracteres',
        maxLength: 'La ciudad no puede tener más de {maxLength} caracteres'
      }
    },
    province: {
      required: true,
      minLength: 2,
      maxLength: 100,
      errorMessages: {
        required: 'La provincia es requerida',
        minLength: 'La provincia debe tener al menos {minLength} caracteres',
        maxLength: 'La provincia no puede tener más de {maxLength} caracteres'
      }
    },
    country: {
      required: true,
      minLength: 2,
      maxLength: 100,
      errorMessages: {
        required: 'El país es requerido',
        minLength: 'El país debe tener al menos {minLength} caracteres',
        maxLength: 'El país no puede tener más de {maxLength} caracteres'
      }
    },
    phoneMain: {
      required: true,
      minLength: 9, // Minimum digits (without formatting)
      errorMessages: {
        required: 'El teléfono es requerido',
        invalid: 'El teléfono no es válido (use formato internacional: +34 XXX XXX XXX)',
        minLength: 'El teléfono debe tener al menos {minLength} dígitos'
      }
    },
    emailMain: {
      required: true,
      errorMessages: {
        required: 'El email es requerido',
        invalid: 'El email no es válido'
      }
    },
    website: {
      required: false,
      errorMessages: {
        required: 'El sitio web es requerido',
        invalid: 'La URL del sitio web no es válida'
      }
    }
  },
  scheduleRange: {
    nameKey: {
      required: true,
      minLength: 3,
      maxLength: 100,
      errorMessages: {
        required: 'El nombre del rango horario es requerido',
        minLength: 'El nombre debe tener al menos {minLength} caracteres',
        maxLength: 'El nombre no puede tener más de {maxLength} caracteres'
      }
    },
    startTime: {
      required: true,
      errorMessages: {
        required: 'La hora de inicio es requerida',
        invalid: 'La hora de inicio debe estar en formato HH:MM (00:00 - 23:59)'
      }
    },
    endTime: {
      required: true,
      errorMessages: {
        required: 'La hora de fin es requerida',
        invalid: 'La hora de fin debe estar en formato HH:MM (00:00 - 23:59)'
      }
    }
  },
  socialMedia: {
    platform: {
      required: true,
      minLength: 2,
      maxLength: 50,
      errorMessages: {
        required: 'La plataforma es requerida',
        minLength: 'La plataforma debe tener al menos {minLength} caracteres',
        maxLength: 'La plataforma no puede tener más de {maxLength} caracteres'
      }
    },
    url: {
      required: true, // Required if enabled
      errorMessages: {
        required: 'La URL es requerida para redes sociales activas',
        invalid: 'La URL no es válida'
      }
    },
    handle: {
      required: true, // Required if enabled
      minLength: 1,
      maxLength: 100,
      errorMessages: {
        required: 'El handle/usuario es requerido para redes sociales activas',
        minLength: 'El handle debe tener al menos {minLength} caracter',
        maxLength: 'El handle no puede tener más de {maxLength} caracteres'
      }
    }
  }
};
