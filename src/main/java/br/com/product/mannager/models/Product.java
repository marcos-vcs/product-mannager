package br.com.product.mannager.models;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Document("products")
@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Product {

    @Id
    private String code;
    @NotBlank
    @NotNull
    private String name;
    @NotBlank
    @NotNull
    private String brand;
    private double price;

}