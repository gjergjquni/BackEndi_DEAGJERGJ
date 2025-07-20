class Validators {
    // Validimi i email-it
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validimi i fjalëkalimit
    static validatePassword(password) {
        // Të paktën 8 karaktere, 1 shkronjë e madhe, 1 numër
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    // Validimi i emrit dhe mbiemrit
    static validateName(name) {
        return name && name.trim().length >= 2 && name.trim().length <= 50;
    }

    // Validimi i datës së lindjes
    static validateDateOfBirth(day, month, year) {
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 100;
        const maxYear = currentYear - 13; // Të paktën 13 vjeç

        if (year < minYear || year > maxYear) {
            return false;
        }

        const date = new Date(year, month - 1, day);
        return date.getDate() === day && 
               date.getMonth() === month - 1 && 
               date.getFullYear() === year;
    }

    // Validimi i statusit të punësimit
    static validateEmploymentStatus(status) {
        const validStatuses = [
            'i punësuar', 'i papunë', 'student', 'pensioner', 'biznesmen'
        ];
        return validStatuses.includes(status);
    }

    // Validimi i transaksioneve
    static validateTransaction(amount, type, category, description) {
        if (!amount || amount <= 0) {
            return { valid: false, message: 'Shuma duhet të jetë më e madhe se 0' };
        }

        if (!['income', 'expense'].includes(type)) {
            return { valid: false, message: 'Tipi i transaksionit duhet të jetë "income" ose "expense"' };
        }

        if (!category || category.trim().length === 0) {
            return { valid: false, message: 'Kategoria është e detyrueshme' };
        }

        if (description && description.length > 200) {
            return { valid: false, message: 'Përshkrimi nuk mund të jetë më i gjatë se 200 karaktere' };
        }

        return { valid: true };
    }

    // Validimi i profilit të përdoruesit
    static validateUserProfile(jobTitle, monthlySalary, savingsGoalPercentage) {
        if (!jobTitle || jobTitle.trim().length === 0) {
            return { valid: false, message: 'Titulli i punës është i detyrueshëm' };
        }

        if (!monthlySalary || monthlySalary <= 0) {
            return { valid: false, message: 'Paga mujore duhet të jetë më e madhe se 0' };
        }

        if (savingsGoalPercentage < 0 || savingsGoalPercentage > 100) {
            return { valid: false, message: 'Përqindja e kursimit duhet të jetë mes 0 dhe 100' };
        }

        return { valid: true };
    }

    // Validimi i datës së raportimit
    static validateDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { valid: false, message: 'Format i pavlefshëm i datës' };
        }

        if (start > end) {
            return { valid: false, message: 'Data e fillimit duhet të jetë para datës së fundit' };
        }

        if (end > now) {
            return { valid: false, message: 'Data e fundit nuk mund të jetë në të ardhmen' };
        }

        return { valid: true };
    }
}

module.exports = Validators; 