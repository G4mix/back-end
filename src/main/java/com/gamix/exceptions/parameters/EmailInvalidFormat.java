package com.gamix.exceptions.parameters;

import com.gamix.enums.ExceptionMessage;
import com.gamix.exceptions.ExceptionBase;

public class EmailInvalidFormat extends ExceptionBase {
    public EmailInvalidFormat() {
        super(ExceptionMessage.EMAIL_INVALID_FORMAT);
    }
}
