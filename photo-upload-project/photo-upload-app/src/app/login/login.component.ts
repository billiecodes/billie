import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoggedIn: boolean = false;
  selectedFile: File | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    const loginData = {
      username: this.username,
      password: this.password
    };

    this.http.post('http://localhost:3000/auth/login', loginData, { withCredentials: true }).subscribe(
      (response: any) => {
        if (response.success) {
          this.isLoggedIn = true;
        } else {
          alert('Login failed. Please check your credentials.');
        }
      },
      error => {
        if (error.status === 401) {
          alert('Unauthorized: Invalid username or password.');
        } else {
          alert('An error occurred during login. Please try again.');
        }
      }
    );
  }

  logout() {
    this.isLoggedIn = false;
    this.username = '';
    this.password = '';
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onUpload() {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('image', this.selectedFile);

      this.http.post('http://localhost:3000/api/upload', formData, { withCredentials: true }).subscribe(
        (response: any) => {
          if (response.message) {
            alert('Photo uploaded and email sent successfully!');
          } else {
            alert('Failed to upload photo.');
          }
        },
        error => {
          console.error('Error during photo upload:', error);
          if (error.status === 400 && error.error === 'Upload limit reached') {
            alert(`Upload limit reached for ${this.username}.`);
          } else if (error.status === 401) {
            alert('Unauthorized: Please log in again.');
          } else {
            alert('An error occurred during photo upload. Please try again.');
          }
        }
      );
    }
  }
}
