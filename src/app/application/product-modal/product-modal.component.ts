import { MaxSizeValidator } from '@angular-material-components/file-input';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PhotoUrlService } from 'src/app/geral/photo-url.service';
import { SnackbarService } from 'src/app/geral/snackbar.service';
import { StorageService } from 'src/app/geral/storage.service';
import { Product } from 'src/app/model/product';
import { ConfirmDialogComponent, ConfirmDialogModel } from '../confirm-dialog/confirm-dialog.component';
import { DatabaseService } from '../database.service';

export interface DialogData {
  product: Product;
  isNew: boolean;
}

@Component({
  selector: 'app-product-modal',
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.css']
})
export class ProductModalComponent implements OnInit {

  product: Product = new Product();
  public message!: string;
  imgURL: any;
  updatePhoto: boolean = false;
  public files!: any[];
  fileControl: FormControl;
  maxSize = 3; //mb
  color: ThemePalette = 'primary';
  isPhoto : boolean = true;
  isSave: boolean = false;
  imagePath: any;

  constructor(
    private snackbar: SnackbarService,
    private database: DatabaseService,
    private photoUrl: PhotoUrlService,
    private storage: StorageService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<ProductModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.fileControl = new FormControl(this.files, [
      Validators.required,
      MaxSizeValidator(this.maxSize * 1024)
    ])
  }

  ngOnInit(): void {
    this.fileControl.valueChanges.subscribe((files: any) => {
      if (!Array.isArray(files)) {
        this.files = [files];
      } else {
        this.files = files;
      }
    })

    this.product = this.data.product;

  }

  private async setPhoto(code: string, product: Product){
    const file = this.files[0];
    await this.storage.upload(file, code);
    this.photoUrl.photoUrl.subscribe(url => {
      product.url = url;
      console.log(product);
      this.database.update(product).subscribe(() => {
        setTimeout(() => {
          this.isSave = false;
          this.dialogRef.close(true);
        }, 5000);
      });
    });

  }

  preview() {
    var reader = new FileReader();
    this.imagePath = this.files[0];
    reader.readAsDataURL(this.files[0]);
    reader.onload = (_event) => {
      this.imgURL = reader.result;
    }
  }

  verifyPhoto(){
    if(this.files[0]){
      this.updatePhoto = true;
    }else{
      this.updatePhoto = false;
    }
  }

  onSubmit(){
    if (this.data.isNew) {
      this.save();
    }else{
      this.update();
    }
  }

  onDelete(code: string | undefined, url : string | undefined){

    const title = 'Excluir produto';
    const message = 'Deseja realmente excluir o produto?';
    const dialogData = new ConfirmDialogModel(title, message);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "500px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if(dialogResult && code && url){
        this.delete(code, url);
      }else if(!code){
        this.snackbar.openSnackbarAlert('Não foi possível excluir o produto, identificador não encontrado!');
      }else{
        this.snackbar.openSnackbarAlert('Operação cancelada!');
      }
    });

  }

  private delete(code: string, url: string){
    this.isSave = true;

    try{
      this.storage.delete(url);
      this.snackbar.openSnackbarSuccess('Foto do produto excluída com sucesso!');

      this.database.delete(code).subscribe((response) => {
        this.snackbar.openSnackbarSuccess('Produto excluído com sucesso!');
        setTimeout(() => {
          this.dialogRef.close(true);
        } , 2000);
      }, (error) => {
        console.log(error);
        this.snackbar.openSnackbarAlert("Erro ao deletar produto!");
      });

    }catch(error){
      this.isSave = false;
      this.snackbar.openSnackbarAlert("Erro ao excluir foto!");
      console.log(error);
    }

  }

  private save(){
    this.isSave = true;
    this.database.create(this.product).subscribe((response) => {
      if(response.response.code){
        this.setPhoto(response.response.code, response.response);
      }
      this.snackbar.openSnackbarSuccess('Produto salvo com sucesso!');

    }, (error) => {
      this.snackbar.openSnackbarAlert(error.message);
      console.log(error);
    });
  }

  private update(){
    this.database.update(this.product).subscribe((response) => {
      try{
        if(this.files[0] && this.product.code ){
          this.setPhoto(this.product.code, this.product);
          console.log("Foto atualizada!");
        }
      }catch(error){
        this.snackbar.openSnackbarAlert("Erro ao atualizar foto!");
        console.log(error);
      }
      this.snackbar.openSnackbarSuccess('Produto atualizado com sucesso!');
      this.dialogRef.close();
    }, (error) => {
      this.snackbar.openSnackbarAlert(error.message);
      console.log(error);
    });
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }

}
