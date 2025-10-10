import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
    hide = true;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
      });
  }

  onSubmit() {
      if (this.loginForm.valid) {
        console.log('Login exitoso:', this.loginForm.value);
        // Aquí podrías llamar a tu AuthService o API
      } else {
        console.log('Formulario inválido');
      }
  }

}
