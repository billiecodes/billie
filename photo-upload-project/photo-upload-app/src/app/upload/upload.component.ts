import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  selectedFile: File | null = null;
  errorMessage: string | null = null; // Property to hold error message
  userEmail: string = 'vanya.ovchar.85@gmail.com'; // Store user email

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.errorMessage = null; // Clear error message on new file selection
    console.log('File selected:', this.selectedFile);
  }

  onUpload() {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      formData.append('email', this.userEmail); // Adjust as needed

      this.http.post('http://localhost:3000/api/upload', formData).subscribe(
        (response: any) => {
          console.log('Response from server:', response);
          if (response.message) {
            this.errorMessage = null; // Clear any previous error messages
            alert(`Photo uploaded and email sent successfully to ${this.userEmail}!`);
          } else {
            this.errorMessage = `Failed to upload photo for ${this.userEmail}.`; // Set error message
          }
        },
        error => {
          console.error('Error during photo upload:', error);
          if (error.status === 400 && error.error.error === 'Upload limit reached') {
            this.errorMessage = `Upload limit reached for ${this.userEmail}.`; // Set upload limit error message
          } else {
            this.errorMessage = `An error occurred during photo upload for ${this.userEmail}. Please try again.`; // Set general error message
          }
          console.log('Error message set:', this.errorMessage); // Debugging statement
        }
      );
    }
  }
}
